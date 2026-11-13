/** Pure editor contracts; no DOM, network access, or source execution. */
export type EditorLanguage = 'matrix' | 'ny'
export type AnalysisKind = 'completion' | 'diagnostics' | 'signature'
export interface AnalysisRequest {
  kind: AnalysisKind
  source: string
  language: EditorLanguage
  version: number
  cursorByte: number
}
export interface EditorCompletion {
  label: string
  insertText: string
  startByte: number
  endByte: number
  detail?: string
  documentation?: string
  kind?: string
}
export interface EditorDiagnostic {
  message: string
  severity: 'error' | 'warning' | 'info'
  startByte: number
  endByte: number
}
export interface AnalysisResult {
  version: number
  completions?: EditorCompletion[]
  diagnostics?: EditorDiagnostic[]
  signature?: string
  status?: string
}
export type AnalysisProvider = (request: AnalysisRequest, signal: AbortSignal) => Promise<AnalysisResult>

export function validUnicode(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = text.charCodeAt(++i)
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false
    } else if (c >= 0xdc00 && c <= 0xdfff) return false
  }
  return true
}

/** Reject offsets inside a surrogate pair or UTF-8 sequence. */
export function utf16ToByte(text: string, offset: number): number | null {
  if (!Number.isInteger(offset) || offset < 0 || offset > text.length || !validUnicode(text)) return null
  if (offset > 0 && offset < text.length && text.charCodeAt(offset - 1) >= 0xd800 && text.charCodeAt(offset - 1) <= 0xdbff) return null
  return new TextEncoder().encode(text.slice(0, offset)).length
}
export function byteToUtf16(text: string, offset: number): number | null {
  if (!Number.isInteger(offset) || offset < 0 || !validUnicode(text)) return null
  let bytes = 0, units = 0
  for (const character of text) {
    if (bytes === offset) return units
    const point = character.codePointAt(0)!
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4
    units += character.length
    if (bytes > offset) return null
  }
  return bytes === offset ? units : null
}
export function completionEdit(source: string, item: EditorCompletion): { from: number; to: number; insert: string } | null {
  if (!item || typeof item.label !== 'string' || typeof item.insertText !== 'string' || item.insertText.length > 65536 || !validUnicode(item.insertText)) return null
  const from = byteToUtf16(source, item.startByte), to = byteToUtf16(source, item.endByte)
  return from !== null && to !== null && to >= from ? { from, to, insert: item.insertText } : null
}

export type QuerySource = 'records' | 'universes' | 'boards' | 'plugins'
export interface QueryControls { source: QuerySource; nameContains: string; boardKind: '' | 'agile' | 'kanban' | 'continuum'; limit: number }
export function makeConcord(controls: QueryControls): string {
  if (!['records', 'universes', 'boards', 'plugins'].includes(controls.source)) throw new Error('Choose a supported record source.')
  if (!Number.isInteger(controls.limit) || controls.limit < 1 || controls.limit > 100) throw new Error('Result limit must be between 1 and 100.')
  if (!validUnicode(controls.nameContains)) throw new Error('Use valid Unicode for the name filter.')
  if (!['', 'agile', 'kanban', 'continuum'].includes(controls.boardKind)) throw new Error('Choose a supported board type.')
  const clauses: string[] = []
  if (controls.nameContains !== '') clauses.push(`name contains ${JSON.stringify(controls.nameContains)}`)
  if (controls.source === 'boards' && controls.boardKind !== '') clauses.push(`kind is ${JSON.stringify(controls.boardKind)}`)
  return `find ${controls.source}${clauses.length ? ` where ${clauses.join(' and ')}` : ''} take ${controls.limit}`
}
export function parseConcord(query: string): QueryControls | null {
  const literal = '"(?:[^"\\\\\\u0000-\\u001f]|\\\\.)*"'
  const pattern = new RegExp(`^find\\s+(records|universes|boards|plugins)(?:\\s+where\\s+(?:name\\s+contains\\s+(${literal})(?:\\s+and\\s+kind\\s+is\\s+(${literal}))?|kind\\s+is\\s+(${literal})))?(?:\\s+take\\s+([0-9]+))?\\s*$`)
  const found = pattern.exec(query.trim())
  if (!found) return null
  try {
    const controls: QueryControls = { source: found[1] as QuerySource, nameContains: found[2] ? JSON.parse(found[2]) : '', boardKind: (found[3] || found[4] ? JSON.parse(found[3] || found[4]) : '') as QueryControls['boardKind'], limit: found[5] ? Number(found[5]) : 10 }
    if (controls.source !== 'boards' && controls.boardKind !== '') return null
    makeConcord(controls)
    return controls
  } catch { return null }
}

export type QueryNodeType = 'trigger' | 'query' | 'display'
export interface QueryNode { id: string; type: QueryNodeType; config: Record<string, unknown> }
export interface QueryGraph { schema: 1; nodes: QueryNode[]; edges: { from: string; to: string }[] }
export function defaultQueryGraph(): QueryGraph {
  return { schema: 1, nodes: [{ id: 'trigger', type: 'trigger', config: {} }, { id: 'query', type: 'query', config: { query: 'find records take 10' } }, { id: 'display', type: 'display', config: { title: 'Query results' } }], edges: [{ from: 'trigger', to: 'query' }, { from: 'query', to: 'display' }] }
}
export function cloneGraph(value: QueryGraph): QueryGraph { return JSON.parse(JSON.stringify(value)) as QueryGraph }
export function validateGraph(value: unknown): string[] {
  const errors: string[] = []
  if (!value || typeof value !== 'object') return ['A query graph is required.']
  const graph = value as Partial<QueryGraph>
  if (graph.schema !== 1 || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return ['Expected a schema 1 graph with nodes and edges.']
  if (Object.keys(graph).some((key) => !['schema', 'nodes', 'edges'].includes(key))) errors.push('Graph contains unsupported fields.')
  if (graph.nodes.length !== 3) errors.push('Use exactly one trigger, one query, and one display node.')
  if (graph.edges.length !== 2) errors.push('Connect trigger → query → display using two connections.')
  const ids = new Map<string, QueryNodeType>(), types = new Map<QueryNodeType, QueryNode>()
  for (const node of graph.nodes) {
    if (!node || typeof node !== 'object' || typeof node.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(node.id) || !['trigger', 'query', 'display'].includes(node.type)) { errors.push('Each node needs a unique identifier and a supported type.'); continue }
    if (Object.keys(node).some((key) => !['id', 'type', 'config'].includes(key))) errors.push('Node contains unsupported fields.')
    if (ids.has(node.id)) errors.push('Node identifiers must be unique.')
    if (types.has(node.type)) errors.push(`Use only one ${node.type} node.`)
    ids.set(node.id, node.type); types.set(node.type, node)
    if (!node.config || typeof node.config !== 'object' || Array.isArray(node.config)) { errors.push('Node configuration must be an object.'); continue }
    const permitted = node.type === 'trigger' ? [] : node.type === 'query' ? ['query'] : ['title']
    if (Object.keys(node.config).some((key) => !permitted.includes(key))) errors.push('Node configuration contains unsupported fields.')
    if (node.type === 'query' && (typeof node.config.query !== 'string' || node.config.query.length > 8000 || !parseConcord(node.config.query))) errors.push('The query node needs a supported read-only Concord query.')
    if (node.type === 'display' && (typeof node.config.title !== 'string' || node.config.title.trim() === '' || node.config.title.length > 160 || !validUnicode(node.config.title) || /[\u0000-\u001f\u007f]/.test(node.config.title))) errors.push('Display title must be a short nonempty text value.')
  }
  for (const type of ['trigger', 'query', 'display'] as const) if (!types.has(type)) errors.push(`Add the ${type} node.`)
  const seen = new Set<string>()
  for (const edge of graph.edges) {
    if (!edge || typeof edge !== 'object' || typeof edge.from !== 'string' || typeof edge.to !== 'string') { errors.push('Connections need source and target identifiers.'); continue }
    if (Object.keys(edge).some((key) => !['from', 'to'].includes(key))) errors.push('Connection contains unsupported fields.')
    const pair = `${edge.from}:${edge.to}`
    if (seen.has(pair)) errors.push('Connections must be unique.')
    seen.add(pair)
    const from = ids.get(edge.from), to = ids.get(edge.to)
    if (!((from === 'trigger' && to === 'query') || (from === 'query' && to === 'display'))) errors.push('Only trigger → query and query → display connections are supported.')
  }
  return [...new Set(errors)]
}

export function analysisMatches(request: AnalysisRequest, source: string, version: number, result: AnalysisResult): boolean {
  return !!result && request.source === source && request.version === version && result.version === version
}
