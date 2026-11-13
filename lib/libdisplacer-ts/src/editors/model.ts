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
export type SourceControls = Omit<QueryControls, 'limit'>
export interface ConcordPredicate { field: string; operation: 'is' | 'contains'; value: string }
export interface ConcordQuery { source: QuerySource; predicates: ConcordPredicate[]; skip: number; take: number }
const bytes = (text: string) => new TextEncoder().encode(text).length
const sources = ['records', 'universes', 'boards', 'plugins']
const boardKinds = ['agile', 'kanban', 'continuum']
const recordTypes = ['universe', 'board', 'plugin']
const safeText = (value: unknown, maximum: number): value is string => typeof value === 'string' && validUnicode(value) && !value.includes('\0') && bytes(value) <= maximum
const exact = (value: unknown, keys: string[]): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))

export function makeSourceConcord(controls: SourceControls): string {
  if (!['records', 'universes', 'boards', 'plugins'].includes(controls.source)) throw new Error('Choose a supported record source.')
  if (!safeText(controls.nameContains, 512)) throw new Error('Use a name filter up to 512 UTF-8 bytes without NUL.')
  if (!['', 'agile', 'kanban', 'continuum'].includes(controls.boardKind)) throw new Error('Choose a supported board type.')
  const clauses: string[] = []
  if (controls.nameContains !== '') clauses.push(`name contains ${JSON.stringify(controls.nameContains)}`)
  if (controls.source === 'boards' && controls.boardKind !== '') clauses.push(`kind is ${JSON.stringify(controls.boardKind)}`)
  return `find ${controls.source}${clauses.length ? ` where ${clauses.join(' and ')}` : ''}`
}
export function makeConcord(controls: QueryControls): string {
  if (!Number.isInteger(controls.limit) || controls.limit < 1 || controls.limit > 100) throw new Error('Result limit must be between 1 and 100.')
  return `${makeSourceConcord(controls)} take ${controls.limit}`
}

/** Parse the closed Concord grammar; an unpaged source explicitly rejects pagination. */
export function parseConcordQuery(query: string, unpaged = false): ConcordQuery | null {
  if (!safeText(query, 2048)) return null
  const tokens: Array<{ kind: string; value: string }> = []
  let offset = 0
  try {
    while (offset < query.length) {
      const rest = query.slice(offset), whitespace = /^[ \t\r\n]+/.exec(rest)
      if (whitespace) { offset += whitespace[0].length; continue }
      if (rest[0] === '"') {
        const literal = /^"(?:[^"\\\u0000-\u001f]|\\.)*"/.exec(rest)
        if (!literal) return null
        const value: unknown = JSON.parse(literal[0])
        if (!safeText(value, 512)) return null
        tokens.push({ kind: 'string', value }); offset += literal[0].length
      } else {
        const item = /^(?:[a-z][a-z0-9-]*|[0-9]+|;)/.exec(rest)
        if (!item) return null
        tokens.push({ kind: /^[0-9]/.test(item[0]) ? 'number' : 'word', value: item[0] }); offset += item[0].length
      }
    }
    let index = 0
    const word = (value: string) => tokens[index]?.kind === 'word' && tokens[index]?.value === value
    const consume = (value: string) => { if (!word(value)) return false; index++; return true }
    if (!consume('find')) return null
    const sourceToken = tokens[index++], source = sourceToken?.value as QuerySource
    if (sourceToken?.kind !== 'word' || !sources.includes(source)) return null
    const predicates: ConcordPredicate[] = []
    if (consume('where')) {
      do {
        const fieldToken = tokens[index++], operationToken = tokens[index++]
        const field = fieldToken?.value, operation = operationToken?.value
        const token = tokens[index++]
        if (fieldToken?.kind !== 'word' || operationToken?.kind !== 'word' || !field || !operation || token?.kind !== 'string' || !['is', 'contains'].includes(operation)) return null
        const allowed = field === 'name' || field === 'id' || (field === 'description' && source !== 'boards') || (source === 'boards' && ['universe-id', 'kind'].includes(field)) || (source === 'records' && field === 'record-type')
        if (!allowed || (operation === 'contains' && !['name', 'description'].includes(field)) || (field === 'description' && operation !== 'contains')) return null
        if (field === 'kind' && !boardKinds.includes(token.value)) return null
        if (field === 'record-type' && !recordTypes.includes(token.value)) return null
        predicates.push({ field, operation: operation as ConcordPredicate['operation'], value: token.value })
        if (predicates.length > 4) return null
      } while (consume('and'))
    }
    let skip = 0, take = 25
    if (consume('skip')) {
      const token = tokens[index++]
      if (unpaged || token?.kind !== 'number') return null
      skip = Number(token.value)
      if (!Number.isInteger(skip) || skip < 0 || skip > 4096) return null
    }
    if (consume('take')) {
      const token = tokens[index++]
      if (unpaged || token?.kind !== 'number') return null
      take = Number(token.value)
      if (!Number.isInteger(take) || take < 1 || take > 100) return null
    }
    consume(';')
    return index === tokens.length ? { source, predicates, skip, take } : null
  } catch { return null }
}
function visualControls(plan: ConcordQuery): SourceControls | null {
  const controls: SourceControls = { source: plan.source, nameContains: '', boardKind: '' }
  const seen = new Set<string>()
  for (const term of plan.predicates) {
    if (seen.has(term.field)) return null
    seen.add(term.field)
    if (term.field === 'name' && term.operation === 'contains') controls.nameContains = term.value
    else if (term.field === 'kind' && term.operation === 'is' && plan.source === 'boards') controls.boardKind = term.value as SourceControls['boardKind']
    else return null
  }
  return controls
}
export function parseSourceConcord(query: string): SourceControls | null {
  const plan = parseConcordQuery(query, true)
  return plan ? visualControls(plan) : null
}
export function parseConcord(query: string): QueryControls | null {
  const plan = parseConcordQuery(query), controls = plan && plan.skip === 0 ? visualControls(plan) : null
  return controls && plan ? { ...controls, limit: plan.take } : null
}

export type QueryNodeType = 'trigger' | 'query' | 'filter' | 'sort' | 'limit' | 'display'
export type PipelinePort = 'request' | 'records'
export interface QueryNode { id: string; type: QueryNodeType; config: Record<string, unknown> }
export interface QueryEdge { from: string; to: string; fromPort?: PipelinePort; toPort?: PipelinePort }
export interface QueryGraph { schema: 1 | 2; nodes: QueryNode[]; edges: QueryEdge[] }
export function defaultQueryGraph(): QueryGraph {
  return { schema: 1, nodes: [{ id: 'trigger', type: 'trigger', config: {} }, { id: 'query', type: 'query', config: { query: 'find records take 10' } }, { id: 'display', type: 'display', config: { title: 'Query results' } }], edges: [{ from: 'trigger', to: 'query' }, { from: 'query', to: 'display' }] }
}
export function defaultPipelineGraph(): QueryGraph {
  return { schema: 2, nodes: [{ id: 'trigger', type: 'trigger', config: {} }, { id: 'query', type: 'query', config: { query: 'find records' } }, { id: 'limit', type: 'limit', config: { skip: 0, take: 25 } }, { id: 'display', type: 'display', config: { title: 'Query results' } }], edges: [{ from: 'trigger', to: 'query', fromPort: 'request', toPort: 'request' }, { from: 'query', to: 'limit', fromPort: 'records', toPort: 'records' }, { from: 'limit', to: 'display', fromPort: 'records', toPort: 'records' }] }
}
export function cloneGraph(value: QueryGraph): QueryGraph { return JSON.parse(JSON.stringify(value)) as QueryGraph }
const phases: Record<QueryNodeType, number> = { trigger: 0, query: 1, filter: 2, sort: 3, limit: 4, display: 5 }
export function nodePorts(type: QueryNodeType): { input?: PipelinePort; output?: PipelinePort } {
  return type === 'trigger' ? { output: 'request' } : type === 'query' ? { input: 'request', output: 'records' } : type === 'display' ? { input: 'records' } : { input: 'records', output: 'records' }
}
/** Only actual edges establish execution order. Unconnected nodes are not a path. */
export function pipelinePath(graph: QueryGraph): QueryNode[] {
  const usable = graph.nodes.filter((node) => node && typeof node.id === 'string' && typeof node.type === 'string')
  const result: QueryNode[] = [], seen = new Set<string>(), nodes = new Map(usable.map((node) => [node.id, node]))
  let node = usable.find((item) => item.type === 'trigger')
  while (node && !seen.has(node.id)) {
    result.push(node); seen.add(node.id)
    const edges = graph.edges.filter((edge) => edge && edge.from === node!.id)
    node = edges.length === 1 ? nodes.get(edges[0].to) : undefined
  }
  return result
}
export function orderedGraphNodes(graph: QueryGraph): QueryNode[] {
  const path = pipelinePath(graph), ids = new Set(path.map((node) => node.id))
  return [...path, ...graph.nodes.filter((node) => node && typeof node.id === 'string' && !ids.has(node.id)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)]
}
const defaults = (type: QueryNodeType): Record<string, unknown> => type === 'query' ? { query: 'find records' } : type === 'filter' ? { field: 'name', operation: 'contains', value: '' } : type === 'sort' ? { field: 'name', direction: 'asc' } : type === 'limit' ? { skip: 0, take: 25 } : type === 'display' ? { title: 'Query results' } : {}
export function insertPipelineNode(graph: QueryGraph, type: QueryNodeType): QueryGraph {
  if (graph.schema !== 2 || !Object.hasOwn(phases, type)) throw new Error('Pipeline insertion requires schema 2.')
  const count = graph.nodes.filter((node) => node.type === type).length
  if (count >= (type === 'filter' ? 4 : 1) || graph.nodes.length >= 9) throw new Error('The pipeline already has its allowed nodes of this type.')
  const next = cloneGraph(graph), path = pipelinePath(graph)
  let id: string = type, suffix = 2
  while (next.nodes.some((node) => node.id === id)) id = `${type}-${suffix++}`
  const node: QueryNode = { id, type, config: defaults(type) }
  next.nodes.push(node)
  const index = path.findIndex((item) => phases[item.type] > phases[type]), before = path[index - 1], after = path[index]
  if (index > 0 && path.length === graph.nodes.length && graph.edges.length === graph.nodes.length - 1 && path.every((item, i) => i === 0 || phases[path[i - 1].type] <= phases[item.type])) {
    next.edges = next.edges.filter((edge) => !(edge.from === before.id && edge.to === after.id))
    next.edges.push({ from: before.id, to: id, fromPort: nodePorts(before.type).output, toPort: nodePorts(type).input }, { from: id, to: after.id, fromPort: nodePorts(type).output, toPort: nodePorts(after.type).input })
  }
  return next
}

function validateLegacyGraph(value: unknown): string[] {
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
    if (node.type === 'query' && (typeof node.config.query !== 'string' || node.config.query.length > 8000 || !parseConcordQuery(node.config.query))) errors.push('The query node needs a supported read-only Concord query.')
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

const filterFields = ['name', 'description', 'id', 'universe-id', 'record-type', 'board-kind']
const sortFields = ['name', 'id', 'record-type', 'universe-id', 'board-kind']
function filterValid(config: Record<string, unknown>): boolean {
  if (!exact(config, ['field', 'operation', 'value']) || typeof config.field !== 'string' || !filterFields.includes(config.field) || !safeText(config.value, 512)) return false
  if (config.operation !== 'is' && !(config.operation === 'contains' && ['name', 'description'].includes(config.field))) return false
  if (['id', 'universe-id'].includes(config.field) && !/^[0-9a-f]{32}$/.test(config.value)) return false
  if (config.field === 'record-type' && !recordTypes.includes(config.value)) return false
  if (config.field === 'board-kind' && !boardKinds.includes(config.value)) return false
  return true
}
export function validateGraph(value: unknown): string[] {
  if ((value as QueryGraph)?.schema === 1) return validateLegacyGraph(value)
  if (!exact(value, ['schema', 'nodes', 'edges']) || value.schema !== 2 || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return ['Expected a schema 1 or schema 2 graph with nodes and edges.']
  const graph = value as unknown as QueryGraph, errors: string[] = [], nodes = new Map<string, QueryNode>(), counts = new Map<QueryNodeType, number>()
  if (graph.nodes.length < 4 || graph.nodes.length > 9 || graph.edges.length !== graph.nodes.length - 1) errors.push('Use 4 to 9 nodes connected as one pipeline.')
  for (const node of graph.nodes) {
    if (!exact(node, ['id', 'type', 'config']) || typeof node.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(node.id) || typeof node.type !== 'string' || !Object.hasOwn(phases, node.type)) { errors.push('Each node needs a unique identifier, a supported type, and only its defined fields.'); continue }
    if (nodes.has(node.id)) errors.push('Node identifiers must be unique.')
    nodes.set(node.id, node as unknown as QueryNode); counts.set(node.type as QueryNodeType, (counts.get(node.type as QueryNodeType) ?? 0) + 1)
    const config = node.config
    if (!config || typeof config !== 'object' || Array.isArray(config)) { errors.push('Node configuration must be an object.'); continue }
    const data = config as Record<string, unknown>
    if (node.type === 'trigger' && !exact(data, [])) errors.push('Trigger configuration must be empty.')
    if (node.type === 'query' && (!exact(data, ['query']) || typeof data.query !== 'string' || !parseConcordQuery(data.query, true))) errors.push('Query needs an unpaged Concord find/where source without skip or take.')
    if (node.type === 'filter' && !filterValid(data)) errors.push('Filter needs a supported field, operator, and typed value up to 512 UTF-8 bytes.')
    if (node.type === 'sort' && (!exact(data, ['field', 'direction']) || typeof data.field !== 'string' || !sortFields.includes(data.field) || !['asc', 'desc'].includes(data.direction as string))) errors.push('Sort needs a supported field and asc or desc direction.')
    if (node.type === 'limit' && (!exact(data, ['skip', 'take']) || !Number.isInteger(data.skip) || (data.skip as number) < 0 || (data.skip as number) > 4096 || !Number.isInteger(data.take) || (data.take as number) < 1 || (data.take as number) > 100)) errors.push('Limit needs skip from 0 to 4096 and take from 1 to 100.')
    if (node.type === 'display' && (!exact(data, ['title']) || !safeText(data.title, 160) || data.title.trim() === '' || data.title !== data.title.trim() || /[\u0000-\u001f\u007f]/.test(data.title))) errors.push('Display needs a short nonempty title without controls or surrounding whitespace.')
  }
  for (const type of ['trigger', 'query', 'limit', 'display'] as const) if (counts.get(type) !== 1) errors.push(`Use exactly one ${type} node.`)
  if ((counts.get('filter') ?? 0) > 4) errors.push('Use at most four filter nodes.')
  if ((counts.get('sort') ?? 0) > 1) errors.push('Use at most one sort node.')
  const incoming = new Map<string, number>(), outgoing = new Map<string, number>(), seen = new Set<string>()
  for (const edge of graph.edges) {
    if (!exact(edge, ['from', 'to', 'fromPort', 'toPort']) || typeof edge.from !== 'string' || typeof edge.to !== 'string') { errors.push('Every connection needs exactly from, to, fromPort, and toPort.'); continue }
    const from = nodes.get(edge.from), to = nodes.get(edge.to)
    if (!from || !to) { errors.push('Connections must reference existing nodes.'); continue }
    const key = `${edge.from}:${edge.fromPort}:${edge.to}:${edge.toPort}`
    if (seen.has(key)) errors.push('Connections must be unique.')
    seen.add(key); outgoing.set(from.id, (outgoing.get(from.id) ?? 0) + 1); incoming.set(to.id, (incoming.get(to.id) ?? 0) + 1)
    if (!nodePorts(from.type).output || edge.fromPort !== nodePorts(from.type).output || !nodePorts(to.type).input || edge.toPort !== nodePorts(to.type).input || edge.fromPort !== edge.toPort) errors.push('Connect compatible request or records output/input ports.')
    if (phases[from.type] > phases[to.type] || (phases[from.type] === phases[to.type] && from.type !== 'filter')) errors.push('Pipeline order is trigger → query → filters → sort → limit → display.')
  }
  for (const node of nodes.values()) if ((incoming.get(node.id) ?? 0) !== (node.type === 'trigger' ? 0 : 1) || (outgoing.get(node.id) ?? 0) !== (node.type === 'display' ? 0 : 1)) errors.push('Use a single pipeline without branches, occupied ports, or disconnected nodes.')
  if (nodes.size === graph.nodes.length && pipelinePath(graph).length !== graph.nodes.length) errors.push('Every node must belong to one acyclic path from trigger to display.')
  return [...new Set(errors)]
}

export function analysisMatches(request: AnalysisRequest, source: string, version: number, result: AnalysisResult): boolean {
  return !!result && request.source === source && request.version === version && result.version === version
}
