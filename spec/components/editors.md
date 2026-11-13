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

`ds-node-editor` accepts two explicitly versioned read-only graph formats.
Loading a graph does not upgrade or rewrite it. `defaultQueryGraph()` retains
the original schema 1 default; `defaultPipelineGraph()` supplies schema 2.

### Schema 1 compatibility

Schema 1 retains its original trigger → query → display contract:

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

It requires exactly one node of each type and the two connections shown. Its
query retains Concord pagination semantics: missing `take` means **25**, not an
unpaged source. Published graphs and generated source are not implicitly
migrated. A host may offer an explicit server-validated upgrade, then pass the
returned graph to `setValue` and update generated source separately. The editor
does not supply a client-side migration that guesses missing query semantics.

### Schema 2 typed pipeline

Schema 2 has one connected, directed path:

```text
trigger → query → 0..4 filters → optional sort → required limit → display
```

It contains 4 to 9 nodes and exactly one fewer edge. Trigger, query, limit,
and display occur exactly once; sort occurs at most once. Repeated filter nodes
apply in order and all must match. Branches, cycles, disconnected nodes,
occupied ports, reversed phases, and unknown fields are invalid.

```json
{
  "schema": 2,
  "nodes": [
    {"id": "trigger", "type": "trigger", "config": {}},
    {"id": "query", "type": "query", "config": {"query": "find records"}},
    {"id": "limit", "type": "limit", "config": {"skip": 0, "take": 25}},
    {"id": "display", "type": "display", "config": {"title": "Query results"}}
  ],
  "edges": [
    {"from": "trigger", "to": "query", "fromPort": "request", "toPort": "request"},
    {"from": "query", "to": "limit", "fromPort": "records", "toPort": "records"},
    {"from": "limit", "to": "display", "fromPort": "records", "toPort": "records"}
  ]
}
```

Every edge has exactly `from`, `to`, `fromPort`, and `toPort`. Trigger has a
`request` output; query has a `request` input and `records` output. Transforms
have `records` input/output ports, and display has a `records` input. Port
buttons are labeled by direction and type. Keyboard users can choose an output
and input port or use the connection selectors.

| Node | Exact configuration | Bounds and semantics |
| --- | --- | --- |
| Trigger | `{}` | Host-requested preview; no scheduling |
| Query | `{query: text}` | Unpaged Concord `find`/`where`; at most 4 base predicates; no `skip`/`take` |
| Filter | `{field, operation, value}` | Typed predicate; all filter nodes must match |
| Sort | `{field, direction}` | Stable UTF-8 byte lexical order; `asc` or `desc` |
| Limit | `{skip, take}` | Integer skip 0..4096 and take 1..100 |
| Display | `{title: text}` | Nonempty trimmed title up to 160 UTF-8 bytes, without controls |

Filter fields `name` and `description` support `is` and `contains`.
`id`, `universe-id`, `record-type`, and `board-kind` support `is` only.
IDs are 32 lowercase hexadecimal characters. Record types are `universe`,
`board`, and `plugin`; board kinds are `agile`, `kanban`, and `continuum`.
Values are valid Unicode without NUL, up to 512 UTF-8 bytes. Sort supports
`name`, `id`, `record-type`, `universe-id`, and `board-kind`; equal values retain
their existing order. A timestamp sort is not offered.

Source controls generate Concord without pagination. Filters and sorting must
apply to all caller-authorized matching records before the Limit step selects
rows. A host must not run a paginated query and apply filters to its truncated
result. Client validation does not replace server validation or authorization.

### Editing and layout

Canvas order follows actual edges from trigger, independent of node-array
order. Disconnected nodes are appended with an invalid state. Adding a node
to a linear pipeline inserts it in the appropriate phase and rewires adjacent
connections atomically; IDs remain stable. Removing an intermediate node joins
compatible adjacent ports. Removing a required node or a connection leaves
explicit validation feedback. Undo/Redo restores graph changes. There is no
arbitrary graph engine or drag interaction in this slice.

The inspector and connection panels stack when the component is 600px wide or
narrower, including inside a split pane on a large viewport. Wider instances
retain two columns. This uses CSS container queries rather than viewport width.
SVG connections use rendered node boundaries for schema 1 and actual port
anchors for schema 2. A ResizeObserver keeps arrows aligned when a host resizes
a split pane. Longer schema 2 pipelines scroll horizontally within the canvas.

The default inspector requires no query syntax. Its source dropdown offers all
records, Universes, boards, or plugins; an optional name filter, board-type
filter for boards generate Concord automatically. Schema 1 keeps the result
limit in its query inspector; schema 2 uses a separate Limit inspector.
String literals use JSON escaping. Advanced Concord preserves richer source
predicates rather than silently replacing them with the simple visual controls:

```text
find SOURCE [where PREDICATE [and PREDICATE ...]] [skip 0..4096] [take 1..100]
```

Sources are `records`, `universes`, `boards`, and `plugins`. Board kinds are
`agile`, `kanban`, and `continuum`. The `skip`/`take` clauses are allowed only in
schema 1 queries. Base Concord predicates retain the original source-specific
fields/operators: name/id for every source, description contains for sources
other than boards, universe-id/kind for boards, and record-type for all records.
At most four predicates are allowed; an optional trailing semicolon is accepted.
The host generates Matrix/Ny source on the server.

| API | Behavior |
| --- | --- |
| `value`, `setValue(graph)`, `getValue()` | Schema 1 or 2 JSON graph; `setValue` and `getValue` copy data |
| `readonly` | Disable graph/configuration edits |
| `ds-change` | Bubbling/composed `{value, valid, errors}` |

`setValue` rejects graphs larger than 64 KiB, 16 nodes, or 32 edges before
rendering. Supported valid graphs are three nodes/two edges for schema 1 and
four to nine nodes/three to eight edges for schema 2. Loading through `setValue`
clears local history and connection selection; it does not change schema.
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
