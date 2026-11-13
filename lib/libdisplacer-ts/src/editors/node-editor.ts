import { LitElement, html, css } from 'lit'
import { property, state } from 'lit/decorators.js'
import { cloneGraph, defaultQueryGraph, makeConcord, parseConcord, validateGraph, type QueryControls, type QueryGraph, type QueryNode, type QueryNodeType } from './model'

/** A bounded, read-only query-panel graph editor. It never evaluates its graph. */
export class DisplacerNodeEditor extends LitElement {
  static styles = css`
    :host{display:block;min-width:0;background:var(--ds-bg-surface,#1a1a1a);color:var(--ds-fg-default,#ece9e5);border:1px solid var(--ds-border,#667581);font:13px/1.7 var(--ds-font-body,system-ui,sans-serif)}
    .toolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--ds-border-muted,#212121);gap:12px;flex-wrap:wrap}.caption{font:10px var(--ds-font-mono,monospace);text-transform:uppercase;letter-spacing:.08em}.tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
    button,select,input,textarea{box-sizing:border-box;font:12px var(--ds-font-control,var(--ds-font-mono,monospace));color:inherit;background:var(--ds-bg-page,#141414);border:1px solid var(--ds-border,#667581);border-radius:0;padding:8px 10px}button{cursor:pointer}button:hover:not(:disabled){color:var(--ds-primary,#f2661a);border-color:var(--ds-primary,#f2661a)}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:2px solid var(--ds-primary,#f2661a);outline-offset:3px}
    .canvas{position:relative;min-height:180px;padding:40px 20px;background-color:var(--ds-bg-page,#141414);background-image:linear-gradient(var(--ds-border-muted,#212121) 1px,transparent 1px),linear-gradient(90deg,var(--ds-border-muted,#212121) 1px,transparent 1px);background-size:24px 24px}.connections{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;color:var(--ds-primary,#f2661a)}.nodes{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:35px}.node{height:100px;width:100%;max-width:210px;margin:auto;background:var(--ds-bg-raised,#262626);text-align:left;padding:17px;z-index:1}.node.selected{border-color:var(--ds-primary,#f2661a);box-shadow:inset 0 2px var(--ds-primary,#f2661a)}.node small{display:block;margin-bottom:9px;color:var(--ds-fg-muted,#9c9893);font:10px var(--ds-font-mono,monospace)}.node strong{display:block;font:500 18px var(--ds-font-display,system-ui,sans-serif)}.empty-node{font-size:12px;color:var(--ds-fg-muted,#9c9893);padding:25px}
    .panels{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(230px,1fr);border-top:1px solid var(--ds-border-muted,#212121)}.panel{min-width:0;padding:22px}.panel+.panel{border-left:1px solid var(--ds-border-muted,#212121)}h3{font:500 19px var(--ds-font-heading,system-ui,sans-serif);margin:0 0 18px}label{display:block;font:10px var(--ds-font-mono,monospace);text-transform:uppercase;letter-spacing:.07em;color:var(--ds-fg-muted,#9c9893);margin:18px 0 7px}label:first-of-type{margin-top:0}input,textarea,select{width:100%;min-height:38px}textarea{min-height:100px;resize:vertical;line-height:1.7}.hint,.message{font-size:12px;color:var(--ds-fg-muted,#9c9893);line-height:1.8;margin:10px 0}.query{font:11px/1.8 var(--ds-font-mono,monospace);white-space:pre-wrap;overflow-wrap:anywhere;background:var(--ds-bg-page,#141414);padding:12px;margin:16px 0}.row{display:flex;gap:8px;align-items:end}.row>div{flex:1;min-width:0}.row button{flex:none}.edge{display:flex;gap:10px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--ds-border-muted,#212121);padding:10px 0;font:10px var(--ds-font-mono,monospace)}.edge span{overflow-wrap:anywhere}.edge button{padding:4px 8px}.remove{margin-top:20px;color:var(--ds-error,#e05252)}details{margin-top:16px}summary{cursor:pointer;font:11px var(--ds-font-mono,monospace)}.validation{border-top:1px solid var(--ds-border-muted,#212121);padding:11px 15px;color:var(--ds-fg-muted,#9c9893);font-size:12px}.validation.invalid{color:var(--ds-warning,#e3b341)}.validation ul{margin:7px 0;padding-left:20px}.add-types{width:auto;min-height:30px}.status-note{margin-top:14px}
    @media(max-width:720px){.panels{grid-template-columns:1fr}.panel+.panel{border-left:0;border-top:1px solid var(--ds-border-muted,#212121)}.nodes{gap:12px}.node{padding:12px;height:95px}.node strong{font-size:14px}.canvas{padding:25px 12px;min-height:145px}.row{flex-wrap:wrap}.row>div{min-width:110px}.toolbar{align-items:start}}
  `
  @property({ attribute: false }) value: QueryGraph = defaultQueryGraph()
  @property({ type: Boolean, reflect: true }) readonly = false
  @state() private selected = 'query'
  @state() private addType: QueryNodeType = 'trigger'
  @state() private from = ''
  @state() private to = ''
  @state() private message = ''
  private undoStack: QueryGraph[] = []
  private redoStack: QueryGraph[] = []
  getValue(): QueryGraph { return cloneGraph(this.value) }
  setValue(value: QueryGraph): void {
    let encoded: string
    try { encoded = JSON.stringify(value) } catch { throw new TypeError('Graph must contain JSON-safe data.') }
    if (new TextEncoder().encode(encoded).length > 65536) throw new RangeError('Graph exceeds the 64 KiB editor limit.')
    const next = JSON.parse(encoded) as QueryGraph
    if (!next || next.schema !== 1 || !Array.isArray(next.nodes) || !Array.isArray(next.edges) || next.nodes.length > 16 || next.edges.length > 32) throw new TypeError('Expected a bounded schema 1 graph.')
    this.value = next; this.undoStack = []; this.redoStack = []; this.selected = next.nodes.find((node) => node?.type === 'query')?.id ?? next.nodes[0]?.id ?? ''; this.message = ''
  }
  private nodes(): QueryNode[] { return Array.isArray(this.value?.nodes) ? this.value.nodes.filter((node) => node && typeof node.id === 'string' && typeof node.type === 'string').slice(0, 16) : [] }
  private edges(): QueryGraph['edges'] { return Array.isArray(this.value?.edges) ? this.value.edges.filter((edge) => edge && typeof edge.from === 'string' && typeof edge.to === 'string').slice(0, 32) : [] }
  private change(value: QueryGraph, remember = true) {
    if (this.readonly) return
    if (remember) { this.undoStack.push(this.getValue()); this.undoStack = this.undoStack.slice(-50); this.redoStack = [] }
    this.value = cloneGraph(value); this.message = ''
    const errors = validateGraph(this.value)
    this.dispatchEvent(new CustomEvent('ds-change', { detail: { value: this.getValue(), valid: errors.length === 0, errors }, bubbles: true, composed: true }))
  }
  private configure(id: string, key: string, content: string) {
    const next = this.getValue(), node = next.nodes.find((item) => item.id === id)
    if (node) { node.config = { ...node.config, [key]: content }; this.change(next) }
  }
  private controls(node: QueryNode): QueryControls | null { return typeof node.config?.query === 'string' ? parseConcord(node.config.query) : null }
  private updateControls(node: QueryNode, changes: Partial<QueryControls>) {
    const old = this.controls(node)
    if (!old) return
    try { this.configure(node.id, 'query', makeConcord({ ...old, ...changes })) }
    catch (error) { this.message = error instanceof Error ? error.message : 'Check the query settings.' }
  }
  private addNode() {
    if (this.nodes().some((node) => node.type === this.addType)) return
    const next = this.getValue(); let id = this.addType as string, suffix = 2
    while (next.nodes.some((node) => node.id === id)) id = `${this.addType}-${suffix++}`
    next.nodes.push({ id, type: this.addType, config: this.addType === 'query' ? { query: 'find records take 10' } : this.addType === 'display' ? { title: 'Query results' } : {} })
    this.selected = id; this.change(next)
  }
  private removeNode(id: string) { const next = this.getValue(); next.nodes = next.nodes.filter((node) => node.id !== id); next.edges = next.edges.filter((edge) => edge.from !== id && edge.to !== id); this.selected = next.nodes[0]?.id ?? ''; this.change(next) }
  private connect() { if (!this.from || !this.to) { this.message = 'Choose a source and target node.'; return } const next = this.getValue(); next.edges.push({ from: this.from, to: this.to }); this.change(next) }
  private undo() { const value = this.undoStack.pop(); if (value) { this.redoStack.push(this.getValue()); this.change(value, false) } }
  private redo() { const value = this.redoStack.pop(); if (value) { this.undoStack.push(this.getValue()); this.change(value, false) } }
  private inspector(node: QueryNode | undefined) {
    if (!node) return html`<p class="hint">Select a node to configure it, or add a missing node.</p>`
    if (node.type === 'trigger') return html`<h3>On request</h3><p class="hint">This read-only query panel runs when the host requests a preview. This node does not schedule background work.</p>`
    if (node.type === 'display') return html`<h3>Display results</h3><label for="display-title">Panel title</label><input id="display-title" maxlength="160" .value=${typeof node.config?.title === 'string' ? node.config.title : ''} ?disabled=${this.readonly} @input=${(event: Event) => this.configure(node.id, 'title', (event.target as HTMLInputElement).value)}><p class="hint">Shown above the results returned by the query.</p>`
    if (node.type !== 'query') return html`<p class="hint">Unsupported node type.</p>`
    const controls = this.controls(node)
    return html`<h3>Choose the records</h3>${controls ? html`
      <label for="record-source">Record source</label><select id="record-source" .value=${controls.source} ?disabled=${this.readonly} @change=${(event: Event) => this.updateControls(node, { source: (event.target as HTMLSelectElement).value as QueryControls['source'], boardKind: '' })}><option value="records">All records</option><option value="universes">Universes</option><option value="boards">Boards</option><option value="plugins">Plugins</option></select>
      <label for="name-filter">Name contains · optional</label><input id="name-filter" .value=${controls.nameContains} ?disabled=${this.readonly} @input=${(event: Event) => this.updateControls(node, { nameContains: (event.target as HTMLInputElement).value })}>
      ${controls.source === 'boards' ? html`<label for="board-kind">Board type</label><select id="board-kind" .value=${controls.boardKind} ?disabled=${this.readonly} @change=${(event: Event) => this.updateControls(node, { boardKind: (event.target as HTMLSelectElement).value as QueryControls['boardKind'] })}><option value="">Any board type</option><option value="agile">Agile</option><option value="kanban">Kanban</option><option value="continuum">Continuum</option></select>` : ''}
      <label for="result-limit">Result limit</label><input id="result-limit" type="number" min="1" max="100" step="1" .value=${String(controls.limit)} ?disabled=${this.readonly} @change=${(event: Event) => this.updateControls(node, { limit: Number((event.target as HTMLInputElement).value) })}>
      <p class="hint">Visual choices generate the read-only query automatically.</p>` : html`<p class="hint">This query needs the advanced editor. Restore a visual query to use the source and filter controls.</p><button type="button" ?disabled=${this.readonly} @click=${() => this.configure(node.id, 'query', 'find records take 10')}>Restore visual query</button>`}
      <pre class="query" aria-label="Generated Concord query">${typeof node.config?.query === 'string' ? node.config.query : ''}</pre>
      <details ?open=${!controls}><summary>Advanced Concord query</summary><label for="advanced-query">Read-only query source</label><textarea id="advanced-query" maxlength="8000" .value=${typeof node.config?.query === 'string' ? node.config.query : ''} ?disabled=${this.readonly} @input=${(event: Event) => this.configure(node.id, 'query', (event.target as HTMLTextAreaElement).value)}></textarea></details>`
  }
  render() {
    const nodes = this.nodes(), edges = this.edges(), selected = nodes.find((node) => node.id === this.selected), errors = validateGraph(this.value)
    const available = !nodes.some((node) => node.type === this.addType)
    return html`<div class="toolbar"><span class="caption">Read-only query panel / 3 node types</span><div class="tools"><select class="add-types" aria-label="Node type to add" .value=${this.addType} @change=${(event: Event) => { this.addType = (event.target as HTMLSelectElement).value as QueryNodeType }}><option value="trigger">Trigger</option><option value="query">Query</option><option value="display">Display</option></select><button type="button" ?disabled=${this.readonly || !available} @click=${this.addNode}>Add node</button><button type="button" ?disabled=${this.readonly || this.undoStack.length === 0} @click=${this.undo}>Undo</button><button type="button" ?disabled=${this.readonly || this.redoStack.length === 0} @click=${this.redo}>Redo</button></div></div>
    <div class="canvas" role="group" aria-label="Query graph nodes"><svg class="connections" viewBox="0 0 960 180" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="currentColor"></path></marker></defs>${edges.map((edge) => { const a = nodes.findIndex((node) => node.id === edge.from), b = nodes.findIndex((node) => node.id === edge.to); return a >= 0 && b >= 0 ? html`<line x1=${160 + a * 320 + 80} y1="90" x2=${160 + b * 320 - 80} y2="90" stroke="currentColor" stroke-width="1.5" marker-end="url(#arrow)"></line>` : '' })}</svg><div class="nodes">${nodes.map((node) => html`<button type="button" class="node ${this.selected === node.id ? 'selected' : ''}" aria-pressed=${this.selected === node.id} @click=${() => { this.selected = node.id }}><small>${node.id}</small><strong>${node.type === 'trigger' ? 'On request' : node.type === 'query' ? 'Find records' : node.type === 'display' ? 'Display results' : node.type}</strong></button>`)}</div>${!nodes.length ? html`<p class="empty-node">Add trigger, query, and display nodes to begin.</p>` : ''}</div>
    <div class="panels"><section class="panel">${this.inspector(selected)}${selected ? html`<button type="button" class="remove" ?disabled=${this.readonly} @click=${() => this.removeNode(selected.id)}>Remove selected node</button>` : ''}${this.message ? html`<p class="message" role="status">${this.message}</p>` : ''}</section><section class="panel"><h3>Connections</h3><p class="hint">The supported chain is trigger → query → display.</p>${edges.map((edge, index) => html`<div class="edge"><span>${edge.from} → ${edge.to}</span><button type="button" aria-label=${`Remove connection ${edge.from} to ${edge.to}`} ?disabled=${this.readonly} @click=${() => { const next = this.getValue(); next.edges.splice(index, 1); this.change(next) }}>Remove</button></div>`)}<div class="row"><div><label for="edge-from">From</label><select id="edge-from" .value=${this.from} ?disabled=${this.readonly} @change=${(event: Event) => { this.from = (event.target as HTMLSelectElement).value }}><option value="">Choose node</option>${nodes.map((node) => html`<option value=${node.id}>${node.id}</option>`)}</select></div><div><label for="edge-to">To</label><select id="edge-to" .value=${this.to} ?disabled=${this.readonly} @change=${(event: Event) => { this.to = (event.target as HTMLSelectElement).value }}><option value="">Choose node</option>${nodes.map((node) => html`<option value=${node.id}>${node.id}</option>`)}</select></div><button type="button" ?disabled=${this.readonly} @click=${this.connect}>Connect</button></div><p class="hint status-note">Only the host can preview, compile, install, or deploy a plugin. Editing this graph does not execute it.</p></section></div>
    <div class="validation ${errors.length ? 'invalid' : ''}" role="status" aria-live="polite">${errors.length ? html`<strong>Graph needs attention</strong><ul>${errors.map((error) => html`<li>${error}</li>`)}</ul>` : 'Valid read-only trigger → query → display graph.'}</div>`
  }
}
if (!customElements.get('ds-node-editor')) customElements.define('ds-node-editor', DisplacerNodeEditor)
declare global { interface HTMLElementTagNameMap { 'ds-node-editor': DisplacerNodeEditor } }
