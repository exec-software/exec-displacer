# Browser authoring editors

`libdisplacer-ts/editors` is an optional browser entry. It registers
`ds-code-editor` and `ds-node-editor`; the normal component entry does not load
CodeMirror. These web controls have no native C or Rust widget counterpart.
Neither control evaluates source or installs, deploys, or executes a plugin.

## Source editor

`ds-code-editor` provides Matrix/Ny syntax highlighting, folding, bracket
matching, indentation, snippets, history, line numbers, and accessible CodeMirror
editing. The syntax adapters are adapted from the MIT licensed Antimatter
implementation. Snippets are local syntax aids, not semantic completions.

| API | Behavior |
| --- | --- |
| `source`, `setValue(text)`, `getValue()` | Read or replace the document |
| `language` | `matrix` or `ny` |
| `label` | Accessible editor label and visible toolbar text |
| `readonly` | Suppress editing and completion application |
| `getSelection()` | `{fromByte, toByte, cursorByte, version}`; offsets are UTF-8 bytes |
| `focusEditor()` | Focus the enhanced editor |
| `ds-change` | Bubbling/composed `{source, language, version, cursorByte}` |
| `ds-selection-change` | Bubbling/composed selection record |

Provide a child native textarea for a usable server-rendered fallback and form
submission. Enhancement initializes from its value when `source` is empty and
keeps its value synchronized. Without a child, a shadow textarea supplies a
plain-text fallback if editor initialization fails.

```html
<ds-code-editor language="matrix" label="Plugin source">
  <textarea name="source" aria-label="Plugin source">book example.panel</textarea>
</ds-code-editor>
```

### Language analysis adapter

The host sets `analysisProvider(request, signal)` or handles the bubbling,
composed `ds-analysis-request` event. Event detail contains `request`, `signal`,
and `respondWith(promise)`; respond synchronously. There is no implicit endpoint,
network request, compiler, LSP server, or execution engine.

```ts
type AnalysisRequest = {
  kind: 'completion' | 'diagnostics' | 'signature'
  source: string
  language: 'matrix' | 'ny'
  version: number
  cursorByte: number
}
type AnalysisResult = {
  version: number
  completions?: Array<{
    label: string; insertText: string; startByte: number; endByte: number
    detail?: string; documentation?: string; kind?: string
  }>
  diagnostics?: Array<{
    message: string; severity: 'error' | 'warning' | 'info'
    startByte: number; endByte: number
  }>
  signature?: string
  status?: string
}
```

All ranges refer to the exact request document in UTF-8 bytes. The editor
rejects offsets inside a UTF-8 sequence, invalid ranges, malformed Unicode,
and results for an older document/version. It aborts superseded requests; the
host should cancel downstream work when signaled. Source analysis is bounded
to 1 MiB. Completion insertion checks the document/version again at acceptance.
The API uses plain text edits rather than snippet syntax for provider results.
Documentation and status are text, never trusted HTML.

Ctrl/Cmd+Space requests completion. The Check action requests diagnostics;
Signature or Ctrl/Cmd+Shift+Space requests a signature. Diagnostics also run
after a short idle delay. Supported compiler/LSP features and their accuracy
belong to the connected provider. Hosts must state which service is connected;
the standalone showcase explicitly labels its optional synthetic fixture.

## Visual query editor

`ds-node-editor` edits a schema 1 read-only query-panel graph:

```json
{
  "schema": 1,
  "nodes": [
    {"id": "trigger", "type": "trigger", "config": {}},
    {"id": "query", "type": "query", "config": {"query": "find records take 10"}},
    {"id": "display", "type": "display", "config": {"title": "Query results"}}
  ],
  "edges": [{"from": "trigger", "to": "query"}, {"from": "query", "to": "display"}]
}
```

This first implementation supports exactly one node of each type and exactly
the two directed connections shown. Native buttons select nodes on a technical
grid; labeled form controls configure them. Add/remove/connect actions permit
editing incomplete graphs, and validation explains why they cannot yet be used.
Undo/Redo restores graph changes. There is no arbitrary graph engine or drag
interaction in this slice.

The inspector and connection panels stack when the component is 600px wide or
narrower, including inside a split pane on a large viewport. Wider instances
retain two columns. This uses CSS container queries rather than viewport width.
SVG connections use the rendered node boundaries and update through a
ResizeObserver, so arrows stay aligned when a host resizes a split pane.

The default inspector requires no query syntax. Its source dropdown offers all
records, Universes, boards, or plugins; an optional name filter, board-type
filter for boards, and limit from 1 through 100 generate Concord automatically.
String literals use JSON escaping. Advanced Concord is optional and accepts
the same bounded grammar:

```text
find SOURCE [where name contains JSON_STRING [and kind is JSON_STRING]] [take 1..100]
find boards [where kind is JSON_STRING] [take 1..100]
```

Sources are `records`, `universes`, `boards`, and `plugins`. Board kinds are
`agile`, `kanban`, and `continuum`. A missing limit is interpreted as 10.
The host validates and authorizes queries again and generates Matrix/Ny source
on the server; client validation is an editing aid.

| API | Behavior |
| --- | --- |
| `value`, `setValue(graph)`, `getValue()` | JSON graph; `setValue` and `getValue` copy data |
| `readonly` | Disable graph/configuration edits |
| `ds-change` | Bubbling/composed `{value, valid, errors}` |

`setValue` rejects graphs larger than 64 KiB, 16 nodes, or 32 edges before
rendering. Supported valid graphs remain limited to three nodes and two edges.
Identifiers and configuration fields are validated; labels, queries, and titles
render as text. Integrators preserve an honest separation between authoring,
server preview, compilation, installation, and deployment.

## Distribution and validation

The library build emits a self-contained ES module `dist/displacer-editors.js`
and `dist/displacer-editors.LICENSE.txt`. Copy both for a self-hosted deployment.
The bundle has no CDN imports or source evaluation. A host can use
`script-src 'self'` and `connect-src 'self'` for its own analysis endpoint;
CodeMirror/Lit require stylesheet injection permitted by the host's style CSP.
Preferred theme fonts remain optional and separate from the editor asset.

Run `npm --prefix lib/libdisplacer-ts run test:editors` for model and offset
tests. Open `editors.html` in the showcase for keyboard, completion-adapter,
graph, responsive, and fallback checks. The fixture is synthetic and provides
no evidence of a real compiler service.
