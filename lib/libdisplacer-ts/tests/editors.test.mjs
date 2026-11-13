import test from 'node:test'
import assert from 'node:assert/strict'
import { analysisMatches, byteToUtf16, cloneGraph, completionEdit, defaultQueryGraph, makeConcord, parseConcord, utf16ToByte, validUnicode, validateGraph } from '../dist/editors/model.js'

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
