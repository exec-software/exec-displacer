import test from 'node:test'
import assert from 'node:assert/strict'
import { analysisMatches, byteToUtf16, cloneGraph, completionEdit, defaultPipelineGraph, defaultQueryGraph, insertPipelineNode, makeConcord, makeSourceConcord, nodePorts, orderedGraphNodes, parseConcord, parseConcordQuery, parseSourceConcord, utf16ToByte, validUnicode, validateGraph } from '../dist/editors/model.js'

test('Unicode positions preserve UTF-8/UTF-16 boundaries', () => {
  const source = 'é😄x\n開発'
  assert.equal(utf16ToByte(source, 0), 0)
  assert.equal(utf16ToByte(source, 1), 2)
  assert.equal(utf16ToByte(source, 2), null)
  assert.equal(utf16ToByte(source, 3), 6)
  assert.equal(byteToUtf16(source, 3), null)
  assert.equal(byteToUtf16(source, 6), 3)
  assert.equal(byteToUtf16(source, 14), 7)
  assert.equal(byteToUtf16(source, 15), null)
  assert.equal(validUnicode('\ud800'), false)
  assert.equal(utf16ToByte('\ud800', 1), null)
})
test('completion applies exactly returned edits and rejects malformed ranges', () => {
  const source = 'é😄 na suffix'
  assert.deepEqual(completionEdit(source, { label: 'name', insertText: 'name', startByte: 7, endByte: 9 }), { from: 4, to: 6, insert: 'name' })
  assert.equal(completionEdit(source, { label: 'bad', insertText: 'x', startByte: 3, endByte: 9 }), null)
  assert.equal(completionEdit(source, { label: 'bad', insertText: 'x', startByte: 9, endByte: 7 }), null)
  assert.equal(completionEdit(source, { label: 'bad', insertText: '\udfff', startByte: 7, endByte: 9 }), null)
})
test('late analysis results do not match newer source or version', () => {
  const request = { kind: 'completion', source: 'name', language: 'matrix', version: 7, cursorByte: 4 }
  assert.equal(analysisMatches(request, 'name', 7, { version: 7 }), true)
  assert.equal(analysisMatches(request, 'changed', 7, { version: 7 }), false)
  assert.equal(analysisMatches(request, 'name', 8, { version: 7 }), false)
  assert.equal(analysisMatches(request, 'name', 7, { version: 6 }), false)
})
test('visual query choices generate escaped Concord, with no source evaluation', () => {
  for (const source of ['records', 'universes', 'boards', 'plugins']) {
    const controls = { source, nameContains: 'a "quoted" \\ path 😄\n', boardKind: source === 'boards' ? 'kanban' : '', limit: 25 }
    assert.deepEqual(parseConcord(makeConcord(controls)), controls)
  }
  assert.equal(makeConcord({ source: 'boards', nameContains: '', boardKind: 'agile', limit: 1 }), 'find boards where kind is "agile" take 1')
  assert.equal(parseConcord('find boards where kind is "unknown"'), null)
  assert.equal(parseConcord('find plugins where kind is "agile"'), null)
  assert.equal(parseConcord('find records take 101'), null)
  assert.equal(parseConcord('find records; run anything'), null)
  assert.throws(() => makeConcord({ source: 'secrets', nameContains: '', boardKind: '', limit: 10 }))
})
test('only the exact trigger-query-display graph validates', () => {
  const graph = defaultQueryGraph()
  assert.deepEqual(validateGraph(graph), [])
  const copy = cloneGraph(graph)
  copy.nodes[1].config.query = 'find boards take 5'
  assert.equal(graph.nodes[1].config.query, 'find records take 10')
  assert.deepEqual(validateGraph(copy), [])
  copy.edges.push({ from: 'display', to: 'trigger' })
  assert.ok(validateGraph(copy).some((error) => error.includes('Only trigger')))
  copy.nodes.pop()
  assert.ok(validateGraph(copy).some((error) => error.includes('display')))
  const injected = defaultQueryGraph()
  injected.nodes[0].config.execute = 'arbitrary source'
  assert.ok(validateGraph(injected).some((error) => error.includes('unsupported fields')))
  assert.ok(validateGraph({ schema: 2, nodes: [], edges: [] }).length)
})
test('legacy graphs remain schema 1 and omitted pagination retains the server default', () => {
  const graph = defaultQueryGraph(), before = JSON.stringify(graph)
  graph.nodes.reverse(); graph.edges.reverse()
  const shuffled = JSON.stringify(graph)
  assert.deepEqual(orderedGraphNodes(graph).map((node) => node.type), ['trigger', 'query', 'display'])
  assert.deepEqual(validateGraph(graph), [])
  assert.equal(JSON.stringify(graph), shuffled)
  assert.equal(cloneGraph(graph).schema, 1)
  assert.equal(parseConcord('find records').limit, 25)
  assert.equal(parseConcordQuery('find boards skip 2;').take, 25)
  assert.equal(parseConcord('find records skip 1'), null)
  assert.equal(JSON.stringify(defaultQueryGraph()), before)
})
test('unpaged sources support Concord predicates but reject hidden pagination', () => {
  const source = 'find boards where name contains "é \\"quoted\\"" and kind is "kanban" and id is "x";'
  assert.equal(parseConcordQuery(source, true).predicates.length, 3)
  assert.equal(parseSourceConcord('find boards where kind is "kanban"').boardKind, 'kanban')
  assert.equal(makeSourceConcord({ source: 'boards', nameContains: 'a"b', boardKind: 'agile' }), 'find boards where name contains "a\\"b" and kind is "agile"')
  for (const query of ['find records take 25', 'find boards skip 0', 'find "records"', 'find records where "name" contains "x"', 'find boards where description contains "x"', 'find records where description is "x"', 'find records where name contains "\\u0000"']) assert.equal(parseConcordQuery(query, true), null, query)
  assert.equal(parseConcordQuery('find records where name contains "1" and name contains "2" and name contains "3" and name contains "4" and name contains "5"', true), null)
})
test('schema 2 insertion rewires one typed pipeline in execution order, independent of arrays', () => {
  const original = defaultPipelineGraph(), originalText = JSON.stringify(original)
  let graph = insertPipelineNode(original, 'sort')
  for (let i = 0; i < 4; i++) graph = insertPipelineNode(graph, 'filter')
  assert.deepEqual(validateGraph(graph), [])
  assert.equal(graph.nodes.length, 9)
  assert.equal(new Set(graph.nodes.map((node) => node.id)).size, 9)
  assert.deepEqual(orderedGraphNodes(graph).map((node) => node.type), ['trigger', 'query', 'filter', 'filter', 'filter', 'filter', 'sort', 'limit', 'display'])
  assert.equal(JSON.stringify(original), originalText)
  graph.nodes.reverse(); graph.edges.reverse()
  assert.deepEqual(validateGraph(graph), [])
  assert.deepEqual(orderedGraphNodes(graph).map((node) => node.type), ['trigger', 'query', 'filter', 'filter', 'filter', 'filter', 'sort', 'limit', 'display'])
  assert.throws(() => insertPipelineNode(graph, 'filter'))
  assert.throws(() => insertPipelineNode(defaultQueryGraph(), 'filter'))
  for (const edge of graph.edges) {
    assert.equal(edge.fromPort, nodePorts(graph.nodes.find((node) => node.id === edge.from).type).output)
    assert.equal(edge.toPort, nodePorts(graph.nodes.find((node) => node.id === edge.to).type).input)
    assert.equal(edge.fromPort, edge.toPort)
  }
})
test('schema 2 rejects phase inversions, occupied ports, cycles, missing limit, and extra fields', () => {
  const cases = [
    (graph) => { graph.edges[0].fromPort = 'records' },
    (graph) => { graph.edges[0].extra = true },
    (graph) => { graph.nodes[1].config.query = 'find records take 100' },
    (graph) => { graph.nodes.find((node) => node.type === 'limit').config.take = 0 },
    (graph) => { graph.nodes.find((node) => node.type === 'limit').config.skip = 4097 },
    (graph) => { graph.nodes = graph.nodes.filter((node) => node.type !== 'limit') },
    (graph) => { graph.edges.push({ from: 'query', to: 'display', fromPort: 'records', toPort: 'records' }) },
    (graph) => { graph.edges[2].to = 'query' },
    (graph) => { graph.nodes[0].config.execute = true },
    (graph) => { graph.edges[0] = null },
    (graph) => { graph.nodes[0] = null },
  ]
  for (const mutate of cases) { const graph = defaultPipelineGraph(); mutate(graph); assert.ok(validateGraph(graph).length) }
  const reversed = insertPipelineNode(insertPipelineNode(defaultPipelineGraph(), 'filter'), 'sort')
  const byType = Object.fromEntries(reversed.nodes.map((node) => [node.type, node.id]))
  reversed.edges = [['trigger', 'query'], ['query', 'sort'], ['sort', 'filter'], ['filter', 'limit'], ['limit', 'display']].map(([a, b]) => ({ from: byType[a], to: byType[b], fromPort: a === 'trigger' ? 'request' : 'records', toPort: b === 'query' ? 'request' : 'records' }))
  assert.ok(validateGraph(reversed).some((message) => message.includes('Pipeline order')))
})
test('schema 2 typed filters and sorts have strict fields, operators, Unicode bounds, and enum values', () => {
  const checkFilter = (config) => { const graph = insertPipelineNode(defaultPipelineGraph(), 'filter'); graph.nodes.find((node) => node.type === 'filter').config = config; return validateGraph(graph) }
  for (const config of [{ field: 'name', operation: 'contains', value: '開発' }, { field: 'description', operation: 'is', value: '' }, { field: 'id', operation: 'is', value: 'a'.repeat(32) }, { field: 'universe-id', operation: 'is', value: '0'.repeat(32) }, { field: 'record-type', operation: 'is', value: 'plugin' }, { field: 'board-kind', operation: 'is', value: 'continuum' }]) assert.deepEqual(checkFilter(config), [])
  for (const config of [{ field: 'id', operation: 'contains', value: 'a'.repeat(32) }, { field: 'id', operation: 'is', value: 'bad' }, { field: 'board-kind', operation: 'is', value: 'waterfall' }, { field: 'record-type', operation: 'is', value: 'secret' }, { field: 'name', operation: 'is', value: 'é'.repeat(257) }, { field: 'name', operation: 'is', value: '\ud800' }, { field: 'name', operation: 'is', value: 'x', unexpected: true }]) assert.ok(checkFilter(config).length)
  const graph = insertPipelineNode(defaultPipelineGraph(), 'sort')
  graph.nodes.find((node) => node.type === 'sort').config.field = 'created-at'
  assert.ok(validateGraph(graph).length)
})
