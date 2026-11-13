import { LitElement, html, svg, css } from 'lit'
import { property, state } from 'lit/decorators.js'
import { cloneGraph, defaultQueryGraph, insertPipelineNode, makeConcord, makeSourceConcord, nodePorts, orderedGraphNodes, parseConcord, parseSourceConcord, pipelinePath, validateGraph, type QueryControls, type QueryGraph, type QueryNode, type QueryNodeType } from './model'

const nodeLabels: Record<QueryNodeType, string> = { trigger: 'On request', query: 'Find records', filter: 'Filter records', sort: 'Sort records', limit: 'Select rows', display: 'Display results' }
const fieldLabels: Record<string, string> = { name: 'Name', description: 'Description', id: 'Record ID', 'universe-id': 'Universe ID', 'record-type': 'Record type', 'board-kind': 'Board type' }

/** A bounded, read-only query-panel graph editor. It never evaluates its graph. */
export class DisplacerNodeEditor extends LitElement {
  static styles = css`
    :host{display:block;min-width:0;container-type:inline-size;background:var(--ds-bg-surface,#1a1a1a);color:var(--ds-fg-default,#ece9e5);border:1px solid var(--ds-border,#667581);font:13px/1.7 var(--ds-font-body,system-ui,sans-serif)}
    .toolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--ds-border-muted,#212121);gap:12px;flex-wrap:wrap}.caption{font:10px var(--ds-font-mono,monospace);text-transform:uppercase;letter-spacing:.08em}.tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
    button,select,input,textarea{box-sizing:border-box;font:12px var(--ds-font-control,var(--ds-font-mono,monospace));color:inherit;background:var(--ds-bg-page,#141414);border:1px solid var(--ds-border,#667581);border-radius:0;padding:8px 10px}button{cursor:pointer}button:hover:not(:disabled){color:var(--ds-primary,#f2661a);border-color:var(--ds-primary,#f2661a)}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:2px solid var(--ds-primary,#f2661a);outline-offset:3px}
    .canvas{position:relative;min-height:180px;padding:40px 20px;background-color:var(--ds-bg-page,#141414);background-image:linear-gradient(var(--ds-border-muted,#212121) 1px,transparent 1px),linear-gradient(90deg,var(--ds-border-muted,#212121) 1px,transparent 1px);background-size:24px 24px}.node-area{position:relative}.connections{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;color:var(--ds-primary,#f2661a)}.nodes{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:35px}.node{height:100px;width:100%;max-width:210px;margin:auto;background:var(--ds-bg-raised,#262626);text-align:left;padding:17px;z-index:1}.node.selected{border-color:var(--ds-primary,#f2661a);box-shadow:inset 0 2px var(--ds-primary,#f2661a)}.node small{display:block;margin-bottom:9px;color:var(--ds-fg-muted,#9c9893);font:10px var(--ds-font-mono,monospace)}.node strong{display:block;font:500 18px var(--ds-font-display,system-ui,sans-serif)}.empty-node{font-size:12px;color:var(--ds-fg-muted,#9c9893);padding:25px}
    .panels{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(230px,1fr);border-top:1px solid var(--ds-border-muted,#212121)}.panel{min-width:0;padding:22px}.panel+.panel{border-left:1px solid var(--ds-border-muted,#212121)}h3{font:500 19px var(--ds-font-heading,system-ui,sans-serif);margin:0 0 18px}label{display:block;font:10px var(--ds-font-mono,monospace);text-transform:uppercase;letter-spacing:.07em;color:var(--ds-fg-muted,#9c9893);margin:18px 0 7px}label:first-of-type{margin-top:0}input,textarea,select{width:100%;min-height:38px}textarea{min-height:100px;resize:vertical;line-height:1.7}.hint,.message{font-size:12px;color:var(--ds-fg-muted,#9c9893);line-height:1.8;margin:10px 0}.query{font:11px/1.8 var(--ds-font-mono,monospace);white-space:pre-wrap;overflow-wrap:anywhere;background:var(--ds-bg-page,#141414);padding:12px;margin:16px 0}.row{display:flex;gap:8px;align-items:end}.row>div{flex:1;min-width:0}.row button{flex:none}.edge{display:flex;gap:10px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--ds-border-muted,#212121);padding:10px 0;font:10px var(--ds-font-mono,monospace)}.edge span{overflow-wrap:anywhere}.edge button{padding:4px 8px}.remove{margin-top:20px;color:var(--ds-error,#e05252)}details{margin-top:16px}summary{cursor:pointer;font:11px var(--ds-font-mono,monospace)}.validation{border-top:1px solid var(--ds-border-muted,#212121);padding:11px 15px;color:var(--ds-fg-muted,#9c9893);font-size:12px}.validation.invalid{color:var(--ds-warning,#e3b341)}.validation ul{margin:7px 0;padding-left:20px}.add-types{width:auto;min-height:30px}.status-note{margin-top:14px}
    @container(max-width:600px){.panels{grid-template-columns:1fr}.panel+.panel{border-left:0;border-top:1px solid var(--ds-border-muted,#212121)}.nodes{gap:12px}.node{padding:12px;height:95px}.node strong{font-size:14px}.canvas{padding:25px 12px;min-height:145px}.row{flex-wrap:wrap}.row>div{min-width:110px}.toolbar{align-items:start}}
    .canvas{overflow-x:auto}.node-area.pipeline{width:max-content;min-width:100%}.nodes.pipeline{display:flex;gap:40px;justify-content:space-between}.node.pipeline{position:relative;box-sizing:border-box;flex:0 0 174px;width:174px;max-width:none;height:124px;padding:0;margin:0;border:1px solid var(--ds-border,#667581)}.node.pipeline.selected{border-color:var(--ds-primary,#f2661a)}.select-node{display:block;width:100%;height:100%;padding:16px 17px 34px;border:0;background:transparent;text-align:left}.select-node small,.node-summary{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.node-summary{display:block;margin-top:8px;font:9px var(--ds-font-mono,monospace);color:var(--ds-fg-muted,#9c9893)}.node.pipeline strong{font-size:17px}.port-labels{position:absolute;bottom:10px;left:12px;right:12px;display:flex;justify-content:space-between;gap:8px;pointer-events:none;color:var(--ds-fg-muted,#9c9893);font:8px var(--ds-font-mono,monospace)}.port{position:absolute;top:50%;transform:translateY(-50%);width:28px;height:34px;padding:0;border:0;background:transparent;display:grid;place-items:center}.port.input{left:-14px}.port.output{right:-14px}.port-dot{box-sizing:border-box;width:12px;height:12px;border:1px solid var(--ds-primary,#f2661a);background:var(--ds-bg-page,#141414);border-radius:50%}.port[data-kind=request] .port-dot{border-color:var(--ds-info,#5ea8e8)}.port.pending .port-dot{background:var(--ds-primary,#f2661a)}.port:focus-visible{outline-offset:0}.node.orphan{border-style:dashed}.disconnected{color:var(--ds-warning,#e3b341)}.port-help{padding:0 15px 12px;margin:0;font-size:11px;color:var(--ds-fg-muted,#9c9893)}
  `
  @property({ attribute: false }) value: QueryGraph = defaultQueryGraph()
  @property({ type: Boolean, reflect: true }) readonly = false
  @state() private selected = 'query'
  @state() private addType: QueryNodeType = 'trigger'
  @state() private from = ''
  @state() private to = ''
  @state() private message = ''
  @state() private lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  private undoStack: QueryGraph[] = []
  private redoStack: QueryGraph[] = []
  private canvasObserver?: ResizeObserver
  connectedCallback() {
    super.connectedCallback()
    if (this.hasUpdated) void this.updateComplete.then(() => { if (this.isConnected) { this.observeCanvas(); this.measureConnections() } })
  }
  firstUpdated() { this.observeCanvas(); this.measureConnections() }
  updated(changed: Map<string, unknown>) { if (changed.has('value')) this.measureConnections() }
  disconnectedCallback() { super.disconnectedCallback(); this.canvasObserver?.disconnect(); this.canvasObserver = undefined }
  private observeCanvas() {
    this.canvasObserver?.disconnect()
    if (typeof ResizeObserver === 'undefined') return
    this.canvasObserver = new ResizeObserver(() => this.measureConnections())
    this.canvasObserver.observe(this)
    const area = this.renderRoot.querySelector('.node-area')
    if (area) this.canvasObserver.observe(area)
  }
  private measureConnections() {
    const area = this.renderRoot.querySelector<HTMLElement>('.node-area')
    if (!area) return
    const bounds = area.getBoundingClientRect(), scaleX = bounds.width ? area.clientWidth / bounds.width : 1, scaleY = bounds.height ? area.clientHeight / bounds.height : 1
    const nodes = new Map(Array.from(this.renderRoot.querySelectorAll<HTMLButtonElement>('.node[data-node-id]'), (node) => [node.dataset.nodeId!, node.getBoundingClientRect()]))
    // Intersect each node's boundary along the center-to-center direction. A
    // small gap keeps the arrowhead visible outside the target's opaque button.
    const endpoint = (node: DOMRect, other: DOMRect) => {
      const cx = node.x + node.width / 2, cy = node.y + node.height / 2
      const dx = other.x + other.width / 2 - cx, dy = other.y + other.height / 2 - cy
      const ratio = dx || dy ? Math.min(dx ? (node.width / 2 + 2) / Math.abs(dx) : Infinity, dy ? (node.height / 2 + 2) / Math.abs(dy) : Infinity) : 0
      return { x: Math.round((cx + dx * ratio - bounds.x) * scaleX * 100) / 100, y: Math.round((cy + dy * ratio - bounds.y) * scaleY * 100) / 100 }
    }
    const next = this.edges().flatMap((edge) => {
      const from = nodes.get(edge.from), to = nodes.get(edge.to)
      if (!from || !to) return []
      if (this.value.schema === 2) {
        const ports = Array.from(this.renderRoot.querySelectorAll<HTMLElement>('.port'))
        const output = ports.find((port) => port.dataset.portNode === edge.from && port.dataset.portDirection === 'output' && port.dataset.kind === edge.fromPort)?.querySelector('.port-dot')?.getBoundingClientRect()
        const input = ports.find((port) => port.dataset.portNode === edge.to && port.dataset.portDirection === 'input' && port.dataset.kind === edge.toPort)?.querySelector('.port-dot')?.getBoundingClientRect()
        if (!output || !input) return []
        const x1 = (output.x + output.width / 2 - bounds.x) * scaleX, y1 = (output.y + output.height / 2 - bounds.y) * scaleY, x2 = (input.x + input.width / 2 - bounds.x) * scaleX, y2 = (input.y + input.height / 2 - bounds.y) * scaleY
        const distance = Math.hypot(x2 - x1, y2 - y1), dx = distance ? (x2 - x1) / distance : 0, dy = distance ? (y2 - y1) / distance : 0
        return [{ x1: x1 + dx * 6, y1: y1 + dy * 6, x2: x2 - dx * 8, y2: y2 - dy * 8 }]
      }
      const a = endpoint(from, to), b = endpoint(to, from)
      return [{ x1: a.x, y1: a.y, x2: b.x, y2: b.y }]
    })
    if (JSON.stringify(next) !== JSON.stringify(this.lines)) this.lines = next
  }
  getValue(): QueryGraph { return cloneGraph(this.value) }
  setValue(value: QueryGraph): void {
    let encoded: string
    try { encoded = JSON.stringify(value) } catch { throw new TypeError('Graph must contain JSON-safe data.') }
    if (new TextEncoder().encode(encoded).length > 65536) throw new RangeError('Graph exceeds the 64 KiB editor limit.')
    const next = JSON.parse(encoded) as QueryGraph
    if (!next || ![1, 2].includes(next.schema) || !Array.isArray(next.nodes) || !Array.isArray(next.edges) || next.nodes.length > 16 || next.edges.length > 32) throw new TypeError('Expected a bounded schema 1 or schema 2 graph.')
    this.value = next; this.undoStack = []; this.redoStack = []; this.selected = next.nodes.find((node) => node?.type === 'query')?.id ?? next.nodes[0]?.id ?? ''; this.message = ''; this.from = ''; this.to = ''; this.addType = next.schema === 2 ? 'filter' : 'trigger'
  }
  private nodes(): QueryNode[] {
    const nodes = Array.isArray(this.value?.nodes) ? this.value.nodes.filter((node) => node && typeof node.id === 'string' && typeof node.type === 'string').slice(0, 16) : []
    return orderedGraphNodes({ ...this.value, nodes, edges: this.edges() })
  }
  private edges(): QueryGraph['edges'] { return Array.isArray(this.value?.edges) ? this.value.edges.filter((edge) => edge && typeof edge.from === 'string' && typeof edge.to === 'string').slice(0, 32) : [] }
  private change(value: QueryGraph, remember = true) {
    if (this.readonly) return
    if (remember) { this.undoStack.push(this.getValue()); this.undoStack = this.undoStack.slice(-50); this.redoStack = [] }
    this.value = cloneGraph(value); this.message = ''
    const errors = validateGraph(this.value)
    this.dispatchEvent(new CustomEvent('ds-change', { detail: { value: this.getValue(), valid: errors.length === 0, errors }, bubbles: true, composed: true }))
  }
  private configure(id: string, key: string, content: unknown) {
    const next = this.getValue(), node = next.nodes.find((item) => item.id === id)
    if (node) { node.config = { ...node.config, [key]: content }; this.change(next) }
  }
  private controls(node: QueryNode): QueryControls | null {
    if (typeof node.config?.query !== 'string') return null
    return this.value.schema === 2 ? (() => { const result = parseSourceConcord(node.config.query); return result ? { ...result, limit: 25 } : null })() : parseConcord(node.config.query)
  }
  private updateControls(node: QueryNode, changes: Partial<QueryControls>) {
    const old = this.controls(node)
    if (!old) return
    try { this.configure(node.id, 'query', this.value.schema === 2 ? makeSourceConcord({ ...old, ...changes }) : makeConcord({ ...old, ...changes })) }
    catch (error) { this.message = error instanceof Error ? error.message : 'Check the query settings.' }
  }
  private addNode() {
    if (this.value.schema === 2) {
      try { const next = insertPipelineNode(this.getValue(), this.addType); this.selected = next.nodes[next.nodes.length - 1].id; this.change(next) }
      catch (error) { this.message = error instanceof Error ? error.message : 'Check the pipeline before adding this node.' }
      return
    }
    if (this.nodes().some((node) => node.type === this.addType)) return
    const next = this.getValue(); let id = this.addType as string, suffix = 2
    while (next.nodes.some((node) => node.id === id)) id = `${this.addType}-${suffix++}`
    next.nodes.push({ id, type: this.addType, config: this.addType === 'query' ? { query: 'find records take 10' } : this.addType === 'display' ? { title: 'Query results' } : {} })
    this.selected = id; this.change(next)
  }
  private removeNode(id: string) {
    const next = this.getValue(), incoming = next.edges.filter((edge) => edge.to === id), outgoing = next.edges.filter((edge) => edge.from === id)
    next.nodes = next.nodes.filter((node) => node.id !== id); next.edges = next.edges.filter((edge) => edge.from !== id && edge.to !== id)
    if (next.schema === 2 && incoming.length === 1 && outgoing.length === 1 && incoming[0].fromPort === outgoing[0].toPort) next.edges.push({ from: incoming[0].from, to: outgoing[0].to, fromPort: incoming[0].fromPort, toPort: outgoing[0].toPort })
    this.selected = next.nodes[0]?.id ?? ''; this.change(next)
  }
  private connect() {
    if (!this.from || !this.to) { this.message = 'Choose a source and target node.'; return }
    const next = this.getValue()
    if (next.edges.some((edge) => edge.from === this.from && edge.to === this.to)) { this.message = 'These nodes are already connected.'; return }
    if (next.schema === 2) {
      const source = next.nodes.find((node) => node.id === this.from), target = next.nodes.find((node) => node.id === this.to)
      const fromPort = source && nodePorts(source.type).output, toPort = target && nodePorts(target.type).input
      if (!fromPort || !toPort || fromPort !== toPort) { this.message = 'Choose compatible request or records output/input ports.'; return }
      next.edges.push({ from: this.from, to: this.to, fromPort, toPort })
    } else next.edges.push({ from: this.from, to: this.to })
    this.change(next)
  }
  private selectPort(node: QueryNode, direction: 'input' | 'output') {
    if (direction === 'output') { this.from = node.id; this.to = ''; this.message = 'Choose a compatible input port, or use the connection selectors.' }
    else { this.to = node.id; if (this.from) this.connect(); else this.message = 'Choose an output port first.' }
  }
  private undo() { const value = this.undoStack.pop(); if (value) { this.redoStack.push(this.getValue()); this.change(value, false) } }
  private redo() { const value = this.redoStack.pop(); if (value) { this.undoStack.push(this.getValue()); this.change(value, false) } }
  private changeFilterField(node: QueryNode, field: string) {
    const next = this.getValue(), item = next.nodes.find((candidate) => candidate.id === node.id)
    if (item) { item.config = { field, operation: ['name', 'description'].includes(field) ? 'contains' : 'is', value: field === 'record-type' ? 'universe' : field === 'board-kind' ? 'agile' : '' }; this.change(next) }
  }
  private filterInspector(node: QueryNode) {
    const field = typeof node.config?.field === 'string' ? node.config.field : 'name', value = typeof node.config?.value === 'string' ? node.config.value : ''
    const options = field === 'record-type' ? [['universe', 'Universe'], ['board', 'Board'], ['plugin', 'Plugin']] : field === 'board-kind' ? [['agile', 'Agile'], ['kanban', 'Kanban'], ['continuum', 'Continuum']] : null
    return html`<h3>Filter records</h3><label for="filter-field">Field</label><select id="filter-field" .value=${field} ?disabled=${this.readonly} @change=${(event: Event) => this.changeFilterField(node, (event.target as HTMLSelectElement).value)}>${Object.entries(fieldLabels).map(([key, label]) => html`<option value=${key} ?selected=${field === key}>${label}</option>`)}</select>
      <label for="filter-operation">Match</label><select id="filter-operation" .value=${typeof node.config?.operation === 'string' ? node.config.operation : 'is'} ?disabled=${this.readonly} @change=${(event: Event) => this.configure(node.id, 'operation', (event.target as HTMLSelectElement).value)}><option value="is" ?selected=${node.config?.operation === 'is'}>Is exactly</option>${['name', 'description'].includes(field) ? html`<option value="contains" ?selected=${node.config?.operation === 'contains'}>Contains</option>` : ''}</select>
      <label for="filter-value">Value</label>${options ? html`<select id="filter-value" .value=${value} ?disabled=${this.readonly} @change=${(event: Event) => this.configure(node.id, 'value', (event.target as HTMLSelectElement).value)}>${options.map(([key, label]) => html`<option value=${key} ?selected=${value === key}>${label}</option>`)}</select>` : html`<input id="filter-value" maxlength="512" .value=${value} ?disabled=${this.readonly} @input=${(event: Event) => this.configure(node.id, 'value', (event.target as HTMLInputElement).value)}>`}
      <p class="hint">${['id', 'universe-id'].includes(field) ? 'Use the full 32-character record or Universe ID.' : 'Text matches are case sensitive.'} Each filter keeps matching records before sorting and pagination. Multiple filters must all match.</p>`
  }
  private sortInspector(node: QueryNode) {
    return html`<h3>Sort records</h3><label for="sort-field">Sort by</label><select id="sort-field" .value=${typeof node.config?.field === 'string' ? node.config.field : 'name'} ?disabled=${this.readonly} @change=${(event: Event) => this.configure(node.id, 'field', (event.target as HTMLSelectElement).value)}>${Object.entries(fieldLabels).filter(([key]) => key !== 'description').map(([key, label]) => html`<option value=${key} ?selected=${node.config?.field === key}>${label}</option>`)}</select>
      <label for="sort-direction">Direction</label><select id="sort-direction" .value=${typeof node.config?.direction === 'string' ? node.config.direction : 'asc'} ?disabled=${this.readonly} @change=${(event: Event) => this.configure(node.id, 'direction', (event.target as HTMLSelectElement).value)}><option value="asc" ?selected=${node.config?.direction === 'asc'}>Ascending</option><option value="desc" ?selected=${node.config?.direction === 'desc'}>Descending</option></select><p class="hint">Stable, case-sensitive text order. Records with equal values keep their existing order. Sorting happens before rows are selected.</p>`
  }
  private limitInspector(node: QueryNode) {
    return html`<h3>Select result rows</h3><label for="result-skip">Skip first · optional</label><input id="result-skip" type="number" min="0" max="4096" step="1" .value=${String(node.config?.skip ?? 0)} ?disabled=${this.readonly} @change=${(event: Event) => this.configure(node.id, 'skip', Number((event.target as HTMLInputElement).value))}>
      <label for="result-limit">Result limit</label><input id="result-limit" type="number" min="1" max="100" step="1" .value=${String(node.config?.take ?? 25)} ?disabled=${this.readonly} @change=${(event: Event) => this.configure(node.id, 'take', Number((event.target as HTMLInputElement).value))}><p class="hint">Skip 0 to 4096 matching records, then show 1 to 100 results. Source matching, filters, and sorting happen first.</p>`
  }
  private renderNode(node: QueryNode, connected: boolean) {
    if (this.value.schema === 1) return html`<button type="button" data-node-id=${node.id} class="node ${this.selected === node.id ? 'selected' : ''}" aria-pressed=${this.selected === node.id} @click=${() => { this.selected = node.id }}><small>${node.id}</small><strong>${nodeLabels[node.type] ?? node.type}</strong></button>`
    const ports = nodePorts(node.type)
    const port = (direction: 'input' | 'output', kind: 'request' | 'records' | undefined) => kind ? html`<button type="button" class="port ${direction} ${direction === 'output' && this.from === node.id ? 'pending' : ''}" data-port-node=${node.id} data-port-direction=${direction} data-kind=${kind} aria-label=${`${node.id}: ${kind} ${direction} port`} title=${`${kind} ${direction}`} ?disabled=${this.readonly} @click=${() => this.selectPort(node, direction)}><span class="port-dot" aria-hidden="true"></span></button>` : ''
    const summary = node.type === 'filter' ? `${fieldLabels[String(node.config?.field)] ?? ''} ${node.config?.operation ?? ''} ${node.config?.value ?? ''}` : node.type === 'sort' ? `${fieldLabels[String(node.config?.field)] ?? ''} / ${node.config?.direction ?? ''}` : node.type === 'limit' ? `Skip ${node.config?.skip ?? 0} / Show ${node.config?.take ?? 25}` : node.type === 'query' ? parseSourceConcord(String(node.config?.query ?? ''))?.source ?? 'Concord source' : node.type === 'display' ? String(node.config?.title ?? '') : 'Host preview request'
    return html`<article data-node-id=${node.id} class="node pipeline ${this.selected === node.id ? 'selected' : ''} ${connected ? '' : 'orphan'}"><button type="button" class="select-node" aria-pressed=${this.selected === node.id} @click=${() => { this.selected = node.id }}><small>${node.id}${connected ? '' : html`<span class="disconnected"> / disconnected</span>`}</small><strong>${nodeLabels[node.type] ?? node.type}</strong><span class="node-summary">${summary}</span></button><div class="port-labels"><span>${ports.input ? `In · ${ports.input}` : ''}</span><span>${ports.output ? `${ports.output} · Out` : ''}</span></div>${port('input', ports.input)}${port('output', ports.output)}</article>`
  }
  private inspector(node: QueryNode | undefined) {
    if (!node) return html`<p class="hint">Select a node to configure it, or add a missing node.</p>`
    if (this.value.schema === 2 && node.type === 'filter') return this.filterInspector(node)
    if (this.value.schema === 2 && node.type === 'sort') return this.sortInspector(node)
    if (this.value.schema === 2 && node.type === 'limit') return this.limitInspector(node)
    if (node.type === 'trigger') return html`<h3>On request</h3><p class="hint">This read-only query panel runs when the host requests a preview. This node does not schedule background work.</p>`
    if (node.type === 'display') return html`<h3>Display results</h3><label for="display-title">Panel title</label><input id="display-title" maxlength="160" .value=${typeof node.config?.title === 'string' ? node.config.title : ''} ?disabled=${this.readonly} @input=${(event: Event) => this.configure(node.id, 'title', (event.target as HTMLInputElement).value)}><p class="hint">Shown above the results returned by the query.</p>`
    if (node.type !== 'query') return html`<p class="hint">Unsupported node type.</p>`
    const controls = this.controls(node)
    return html`<h3>Choose the records</h3>${controls ? html`
      <label for="record-source">Record source</label><select id="record-source" .value=${controls.source} ?disabled=${this.readonly} @change=${(event: Event) => this.updateControls(node, { source: (event.target as HTMLSelectElement).value as QueryControls['source'], boardKind: '' })}><option value="records">All records</option><option value="universes">Universes</option><option value="boards">Boards</option><option value="plugins">Plugins</option></select>
      <label for="name-filter">Name contains · optional</label><input id="name-filter" .value=${controls.nameContains} ?disabled=${this.readonly} @input=${(event: Event) => this.updateControls(node, { nameContains: (event.target as HTMLInputElement).value })}>
      ${controls.source === 'boards' ? html`<label for="board-kind">Board type</label><select id="board-kind" .value=${controls.boardKind} ?disabled=${this.readonly} @change=${(event: Event) => this.updateControls(node, { boardKind: (event.target as HTMLSelectElement).value as QueryControls['boardKind'] })}><option value="">Any board type</option><option value="agile">Agile</option><option value="kanban">Kanban</option><option value="continuum">Continuum</option></select>` : ''}
      ${this.value.schema === 1 ? html`<label for="result-limit">Result limit</label><input id="result-limit" type="number" min="1" max="100" step="1" .value=${String(controls.limit)} ?disabled=${this.readonly} @change=${(event: Event) => this.updateControls(node, { limit: Number((event.target as HTMLInputElement).value) })}>` : ''}
      <p class="hint">${this.value.schema === 2 ? 'Visual choices generate an unpaged source. The separate Limit step selects result rows after filters and sorting.' : 'Visual choices generate the read-only query automatically.'}</p>` : html`<p class="hint">This query uses the advanced editor. Restore a visual query to replace it with simple source and filter controls.</p><button type="button" ?disabled=${this.readonly} @click=${() => this.configure(node.id, 'query', this.value.schema === 2 ? 'find records' : 'find records take 10')}>Restore visual query</button>`}
      <pre class="query" aria-label="Generated Concord query">${typeof node.config?.query === 'string' ? node.config.query : ''}</pre>
      <details ?open=${!controls}><summary>Advanced Concord query</summary><label for="advanced-query">Read-only query source</label><textarea id="advanced-query" maxlength="8000" .value=${typeof node.config?.query === 'string' ? node.config.query : ''} ?disabled=${this.readonly} @input=${(event: Event) => this.configure(node.id, 'query', (event.target as HTMLTextAreaElement).value)}></textarea></details>`
  }
  render() {
    const nodes = this.nodes(), edges = this.edges(), selected = nodes.find((node) => node.id === this.selected), errors = validateGraph(this.value)
    const pipeline = this.value.schema === 2, types: QueryNodeType[] = pipeline ? ['filter', 'sort', 'limit', 'query', 'trigger', 'display'] : ['trigger', 'query', 'display']
    const available = nodes.filter((node) => node.type === this.addType).length < (pipeline && this.addType === 'filter' ? 4 : 1) && nodes.length < (pipeline ? 9 : 3)
    const connected = new Set(pipelinePath({ ...this.value, nodes, edges }).map((node) => node.id))
    return html`<div class="toolbar"><span class="caption">Read-only query ${pipeline ? 'pipeline / schema 2' : 'panel / schema 1'}</span><div class="tools"><select class="add-types" aria-label="Node type to add" .value=${this.addType} @change=${(event: Event) => { this.addType = (event.target as HTMLSelectElement).value as QueryNodeType }}>${types.map((type) => html`<option value=${type} ?selected=${this.addType === type}>${nodeLabels[type]}</option>`)}</select><button type="button" ?disabled=${this.readonly || !available} @click=${this.addNode}>Add node</button><button type="button" ?disabled=${this.readonly || this.undoStack.length === 0} @click=${this.undo}>Undo</button><button type="button" ?disabled=${this.readonly || this.redoStack.length === 0} @click=${this.redo}>Redo</button></div></div>
    <div class="canvas" role="group" aria-label="Query graph nodes"><div class="node-area ${pipeline ? 'pipeline' : ''}"><svg class="connections" aria-hidden="true"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="currentColor"></path></marker></defs>${this.lines.map((line) => svg`<line x1=${line.x1} y1=${line.y1} x2=${line.x2} y2=${line.y2} stroke="currentColor" stroke-width="1.5" marker-end="url(#arrow)"></line>`)}</svg><div class="nodes ${pipeline ? 'pipeline' : ''}">${nodes.map((node) => this.renderNode(node, connected.has(node.id)))}</div></div>${!nodes.length ? html`<p class="empty-node">Add the required nodes to begin.</p>` : ''}</div>
    ${pipeline ? html`<p class="port-help">Choose an output port, then a compatible input. Added steps are inserted in pipeline order. Scroll the canvas to see a longer pipeline.</p>` : html`<p class="port-help">Schema 1 keeps its original query behavior. Use the host's explicit upgrade action to add pipeline steps.</p>`}
    <div class="panels"><section class="panel">${this.inspector(selected)}${selected ? html`<button type="button" class="remove" ?disabled=${this.readonly} @click=${() => this.removeNode(selected.id)}>Remove selected node</button>` : ''}${this.message ? html`<p class="message" role="status">${this.message}</p>` : ''}</section><section class="panel"><h3>Connections</h3>
      <p class="hint">${pipeline ? 'Connect trigger → query → up to 4 filters → optional sort → limit → display. Request ports connect to request ports; records ports connect to records ports.' : 'The supported chain is trigger → query → display.'}</p>
      ${edges.map((edge, index) => html`<div class="edge"><span>${edge.from}${pipeline ? `.${edge.fromPort ?? '?'}` : ''} → ${edge.to}${pipeline ? `.${edge.toPort ?? '?'}` : ''}</span><button type="button" aria-label=${`Remove connection ${edge.from} to ${edge.to}`} ?disabled=${this.readonly} @click=${() => { const next = this.getValue(); next.edges.splice(index, 1); this.change(next) }}>Remove</button></div>`)}
      <div class="row"><div><label for="edge-from">From</label><select id="edge-from" .value=${this.from} ?disabled=${this.readonly} @change=${(event: Event) => { this.from = (event.target as HTMLSelectElement).value }}><option value="" ?selected=${this.from === ''}>Choose output</option>${nodes.filter((node) => !pipeline || nodePorts(node.type).output).map((node) => html`<option value=${node.id} ?selected=${this.from === node.id}>${node.id}${pipeline ? ` · ${nodePorts(node.type).output}` : ''}</option>`)}</select></div>
      <div><label for="edge-to">To</label><select id="edge-to" .value=${this.to} ?disabled=${this.readonly} @change=${(event: Event) => { this.to = (event.target as HTMLSelectElement).value }}><option value="" ?selected=${this.to === ''}>Choose input</option>${nodes.filter((node) => !pipeline || nodePorts(node.type).input).map((node) => html`<option value=${node.id} ?selected=${this.to === node.id}>${node.id}${pipeline ? ` · ${nodePorts(node.type).input}` : ''}</option>`)}</select></div><button type="button" ?disabled=${this.readonly} @click=${this.connect}>Connect</button></div>
      <p class="hint status-note">Only the host can preview, compile, install, or deploy a plugin. Editing this graph does not execute it.</p></section></div>
    <div class="validation ${errors.length ? 'invalid' : ''}" role="status" aria-live="polite">${errors.length ? html`<strong>Graph needs attention</strong><ul>${errors.map((error) => html`<li>${error}</li>`)}</ul>` : pipeline ? 'Valid read-only pipeline. Filters and sorting precede result selection.' : 'Valid read-only trigger → query → display graph.'}</div>`
  }
}
if (!customElements.get('ds-node-editor')) customElements.define('ds-node-editor', DisplacerNodeEditor)
declare global { interface HTMLElementTagNameMap { 'ds-node-editor': DisplacerNodeEditor } }
