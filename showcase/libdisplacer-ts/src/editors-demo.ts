import { applyTheme, execute, defaultPipelineGraph, defaultQueryGraph, utf16ToByte, byteToUtf16, type AnalysisProvider, type DisplacerCodeEditor, type DisplacerNodeEditor } from 'libdisplacer-ts/editors'

// The demo uses system fonts; hosts can provide the theme's preferred fonts.
applyTheme({ ...execute, fonts: { body: 'system-ui, sans-serif', display: 'system-ui, sans-serif', heading: 'system-ui, sans-serif', control: 'ui-monospace, monospace', mono: 'ui-monospace, monospace' } })
const code = document.querySelector<DisplacerCodeEditor>('ds-code-editor')!
const graph = document.querySelector<DisplacerNodeEditor>('ds-node-editor')!
graph.setValue(defaultPipelineGraph())
const selection = document.querySelector('#selection')!
const fixture: AnalysisProvider = async (request, signal) => {
  // Deliberately synthetic: exercises the adapter contract, never compiler claims.
  await new Promise<void>((resolve) => setTimeout(resolve, 120))
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  const cursor = byteToUtf16(request.source, request.cursorByte) ?? 0
  const prefix = request.source.slice(0, cursor).match(/[\w-]*$/)?.[0] ?? ''
  const from = utf16ToByte(request.source, cursor - prefix.length)!
  const error = request.source.indexOf('fixture-error')
  return {
    version: request.version,
    status: 'Synthetic fixture · no compiler connected',
    completions: request.kind === 'completion' ? [{ label: 'fixture-value', insertText: 'fixture-value', startByte: from, endByte: request.cursorByte, detail: 'Synthetic adapter example', documentation: 'Plain text only: <img src=x onerror=alert(1)> is documentation, never HTML.', kind: 'variable' }] : [],
    diagnostics: error >= 0 ? [{ startByte: utf16ToByte(request.source, error)!, endByte: utf16ToByte(request.source, error + 13)!, severity: 'warning', message: 'Synthetic fixture warning. This is not a compiler diagnostic.' }] : [],
    signature: 'fixture(value as text) returns text — synthetic example',
  }
}
document.querySelector<HTMLInputElement>('#fixture')!.addEventListener('change', (event) => {
  const enabled = (event.target as HTMLInputElement).checked
  code.analysisProvider = enabled ? fixture : undefined
  document.querySelector('#fixture-note')!.textContent = enabled ? 'Synthetic fixture enabled. Type fixture, press Ctrl+Space, and choose fixture-value. Check and Signature exercise the same adapter.' : 'Fixture off. No semantic language service is connected.'
})
document.querySelector<HTMLSelectElement>('#language')!.addEventListener('change', (event) => { code.language = (event.target as HTMLSelectElement).value as 'matrix' | 'ny' })
const updateSelection = () => { const value = code.getSelection(); selection.textContent = `Selection / UTF-8 bytes ${value.fromByte}–${value.toByte} · cursor ${value.cursorByte} · document version ${value.version}` }
code.addEventListener('ds-change', updateSelection)
code.addEventListener('ds-selection-change', updateSelection)
const updateGraph = () => { document.querySelector('#graph-data')!.textContent = JSON.stringify(graph.getValue(), null, 2) }
document.querySelector<HTMLSelectElement>('#graph-sample')!.addEventListener('change', (event) => {
  graph.setValue((event.target as HTMLSelectElement).value === '1' ? defaultQueryGraph() : defaultPipelineGraph())
  document.querySelector('#graph-status')!.textContent = 'Graph / sample loaded · no query executed'
  updateGraph()
})
graph.addEventListener('ds-change', (event) => {
  const detail = (event as CustomEvent).detail
  document.querySelector('#graph-status')!.textContent = detail.valid ? 'Graph / valid · no query executed' : `Graph / ${detail.errors.length} validation issue(s)`
  updateGraph()
})
updateGraph()
