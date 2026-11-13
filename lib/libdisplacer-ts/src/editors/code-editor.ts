import { LitElement, html, css } from 'lit'
import { property, state } from 'lit/decorators.js'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, type Completion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { setDiagnostics, lintGutter, type Diagnostic } from '@codemirror/lint'
import { tags } from '@lezer/highlight'
import { matrix, matrixLocalCompletions } from './languages/matrix'
import { ny, nyLocalCompletions } from './languages/ny'
import { analysisMatches, byteToUtf16, completionEdit, utf16ToByte, validUnicode, type AnalysisKind, type AnalysisProvider, type AnalysisRequest, type AnalysisResult, type EditorLanguage } from './model'

const colors = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword], color: 'var(--ds-primary, #f2661a)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--ds-success, #6cc07f)' },
  { tag: [tags.number, tags.bool, tags.atom], color: 'var(--ds-warning, #e3b341)' },
  { tag: [tags.typeName, tags.className], color: 'var(--ds-info, #5ea8e8)' },
  { tag: tags.comment, color: 'var(--ds-fg-muted, #9c9893)' },
  { tag: tags.invalid, color: 'var(--ds-error, #e05252)' },
])

/** A source editor. The host supplies analysis; this element never executes source. */
export class DisplacerCodeEditor extends LitElement {
  static styles = css`
    :host{display:block;min-width:0;border:1px solid var(--ds-border,#667581);background:var(--ds-bg-surface,#1a1a1a);color:var(--ds-fg-default,#ece9e5);font:12px var(--ds-font-body,system-ui,sans-serif)}
    .toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 12px;border-bottom:1px solid var(--ds-border-muted,#212121);flex-wrap:wrap}
    .label{font:11px var(--ds-font-mono,monospace);text-transform:uppercase;letter-spacing:.08em}.tools{display:flex;gap:7px}
    button{font:10px var(--ds-font-control,monospace);padding:6px 10px;background:transparent;border:1px solid var(--ds-border,#667581);color:inherit;cursor:pointer}
    button:focus-visible,textarea:focus-visible{outline:2px solid var(--ds-primary,#f2661a);outline-offset:3px}button:hover{color:var(--ds-primary,#f2661a)}
    .editor{min-height:240px}.fallback textarea,::slotted(textarea){box-sizing:border-box;width:100%;min-height:240px;resize:vertical;padding:12px;border:0;background:var(--ds-bg-page,#141414);color:inherit;font:13px/1.7 var(--ds-font-mono,monospace)}
    [hidden]{display:none!important}.status,.signature{padding:9px 12px;border-top:1px solid var(--ds-border-muted,#212121);font:10px/1.6 var(--ds-font-mono,monospace);color:var(--ds-fg-muted,#9c9893);overflow-wrap:anywhere}.signature{color:var(--ds-fg-default,#ece9e5);white-space:pre-wrap}.error{color:var(--ds-error,#e05252)}
  `
  @property({ type: String }) source = ''
  @property({ type: String }) language: EditorLanguage = 'matrix'
  @property({ type: String }) label = 'Source editor'
  @property({ type: Boolean, reflect: true }) readonly = false
  @property({ attribute: false }) analysisProvider?: AnalysisProvider
  @state() private ready = false
  @state() private status = 'Matrix snippets · no language service connected'
  @state() private signature = ''
  private view?: EditorView
  private languageConfig = new Compartment()
  private readonlyConfig = new Compartment()
  private version = 1
  private requests = new Map<AnalysisKind, AbortController>()
  private timer?: ReturnType<typeof setTimeout>
  private disposed = false

  connectedCallback() { super.connectedCallback(); this.disposed = false; if (this.hasUpdated) void this.updateComplete.then(() => { if (this.isConnected && !this.view) this.initializeEditor() }) }
  firstUpdated() { this.initializeEditor() }
  private initializeEditor() {
    const fallback = this.querySelector('textarea')
    if (this.source === '' && fallback) this.source = fallback.value
    this.syncFallback()
    try {
      this.view = new EditorView({ parent: this.renderRoot.querySelector('.editor')!, root: this.shadowRoot!, state: EditorState.create({ doc: this.source, extensions: [
        lineNumbers(), history(), drawSelection(), highlightActiveLine(), bracketMatching(), closeBrackets(), foldGutter(), indentOnInput(), lintGutter(), syntaxHighlighting(colors),
        this.languageConfig.of(this.language === 'ny' ? ny() : matrix()),
        this.readonlyConfig.of([EditorState.readOnly.of(this.readonly), EditorView.editable.of(!this.readonly)]),
        keymap.of([{ key: 'Mod-Shift-Space', run: () => { void this.analyze('signature'); return true } }, ...completionKeymap, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        autocompletion({ override: [(context) => this.completions(context)] }),
        EditorView.theme({ '&': { color: 'var(--ds-fg-default, #ece9e5)', backgroundColor: 'var(--ds-bg-page, #141414)', fontSize: '13px' }, '.cm-scroller': { fontFamily: 'var(--ds-font-mono, monospace)', lineHeight: '1.7', maxHeight: 'min(65vh, 800px)', overflow: 'auto' }, '.cm-content': { minHeight: '240px' }, '.cm-gutters': { backgroundColor: 'var(--ds-bg-surface, #1a1a1a)', color: 'var(--ds-fg-muted, #9c9893)', borderColor: 'var(--ds-border-muted, #212121)' }, '.cm-activeLine,.cm-activeLineGutter': { backgroundColor: 'var(--ds-bg-surface-alt, #222)' }, '&.cm-focused': { outline: '2px solid var(--ds-primary, #f2661a)', outlineOffset: '-2px' }, '.cm-cursor': { borderLeftColor: 'var(--ds-primary, #f2661a)' }, '.cm-tooltip': { color: 'var(--ds-fg-default, #ece9e5)', backgroundColor: 'var(--ds-bg-raised, #262626)', borderColor: 'var(--ds-border, #667581)' }, '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: 'var(--ds-primary, #f2661a)', color: 'var(--ds-fg-inverse, #0f0f0f)' } }, { dark: true }),
        EditorView.contentAttributes.of({ 'aria-label': this.label }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.source = update.state.doc.toString(); this.version++; this.cancelRequests(); this.signature = ''
            this.syncFallback(); this.emitChange(); this.queueDiagnostics()
          } else if (update.selectionSet) this.dispatchEvent(new CustomEvent('ds-selection-change', { detail: this.getSelection(), bubbles: true, composed: true }))
        }),
      ] }) })
      this.ready = true
      this.status = `${this.language === 'ny' ? 'Ny' : 'Matrix'} snippets · language analysis connects through the host`
      this.queueDiagnostics()
    } catch { this.status = 'Plain-text fallback · enhanced editor could not start'; this.ready = false }
  }
  updated(changed: Map<string, unknown>) {
    if (changed.has('source') || changed.has('readonly')) this.syncFallback()
    if (!this.view) return
    if (changed.has('source') && this.source !== this.view.state.doc.toString()) this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: this.source } })
    if (changed.has('language')) { this.version++; this.cancelRequests(); this.view.dispatch({ effects: this.languageConfig.reconfigure(this.language === 'ny' ? ny() : matrix()) }); this.queueDiagnostics() }
    if (changed.has('readonly')) this.view.dispatch({ effects: this.readonlyConfig.reconfigure([EditorState.readOnly.of(this.readonly), EditorView.editable.of(!this.readonly)]) })
    if (changed.has('analysisProvider')) this.queueDiagnostics()
  }
  disconnectedCallback() { super.disconnectedCallback(); this.disposed = true; this.ready = false; clearTimeout(this.timer); this.cancelRequests(); this.view?.destroy(); this.view = undefined }
  getValue(): string { return this.view?.state.doc.toString() ?? this.source }
  setValue(source: string): void { if (typeof source !== 'string') throw new TypeError('Editor source must be text.'); this.source = source }
  getSelection(): { fromByte: number | null; toByte: number | null; cursorByte: number | null; version: number } {
    const selection = this.view?.state.selection.main, source = this.getValue()
    return { fromByte: utf16ToByte(source, selection?.from ?? 0), toByte: utf16ToByte(source, selection?.to ?? 0), cursorByte: utf16ToByte(source, selection?.head ?? 0), version: this.version }
  }
  focusEditor(): void { this.view?.focus() }
  private syncFallback() { const field = this.querySelector('textarea'); if (field) { field.value = this.source; field.readOnly = this.readonly } }
  private emitChange() { this.dispatchEvent(new CustomEvent('ds-change', { detail: { source: this.getValue(), language: this.language, version: this.version, cursorByte: this.getSelection().cursorByte }, bubbles: true, composed: true })) }
  private cancelRequests() { for (const controller of this.requests.values()) controller.abort(); this.requests.clear() }
  private queueDiagnostics() { clearTimeout(this.timer); this.timer = setTimeout(() => void this.analyze('diagnostics'), 350) }
  private async query(kind: AnalysisKind, cursor: number): Promise<{ result: AnalysisResult; request: AnalysisRequest } | null> {
    const source = this.getValue(), cursorByte = utf16ToByte(source, cursor)
    if (cursorByte === null || !validUnicode(source) || new TextEncoder().encode(source).length > 1048576) { this.status = 'Analysis requires valid Unicode source up to 1 MiB'; return null }
    const request: AnalysisRequest = { kind, source, language: this.language === 'ny' ? 'ny' : 'matrix', version: this.version, cursorByte }
    this.requests.get(kind)?.abort()
    const controller = new AbortController(); this.requests.set(kind, controller)
    try {
      let promise: Promise<AnalysisResult> | undefined
      if (this.analysisProvider) promise = this.analysisProvider(request, controller.signal)
      else this.dispatchEvent(new CustomEvent('ds-analysis-request', { detail: { request, signal: controller.signal, respondWith: (value: Promise<AnalysisResult>) => { if (!promise) promise = value } }, bubbles: true, composed: true }))
      if (!promise) { this.status = `${request.language === 'ny' ? 'Ny' : 'Matrix'} snippets · no language service connected`; return null }
      const result = await promise
      if (this.disposed || controller.signal.aborted || !analysisMatches(request, this.getValue(), this.version, result)) return null
      this.status = typeof result.status === 'string' ? result.status.slice(0, 250) : 'Language provider responded'
      return { result, request }
    } catch { if (!controller.signal.aborted) this.status = 'Language analysis unavailable · snippets remain available'; return null }
    finally { if (this.requests.get(kind) === controller) this.requests.delete(kind) }
  }
  private async analyze(kind: AnalysisKind) {
    const outcome = await this.query(kind, this.view?.state.selection.main.head ?? 0)
    if (!outcome || !this.view) return
    if (kind === 'signature') { this.signature = typeof outcome.result.signature === 'string' ? outcome.result.signature.slice(0, 65536) : 'No supported signature at this position.'; return }
    const diagnostics: Diagnostic[] = []
    for (const item of (Array.isArray(outcome.result.diagnostics) ? outcome.result.diagnostics : []).slice(0, 4096)) {
      if (!item || typeof item.message !== 'string' || !['error', 'warning', 'info'].includes(item.severity)) continue
      const from = byteToUtf16(outcome.request.source, item.startByte), to = byteToUtf16(outcome.request.source, item.endByte)
      if (from === null || to === null || to < from) continue
      diagnostics.push({ from, to, severity: item.severity, message: item.message.slice(0, 65536), source: 'Language provider' })
    }
    this.view.dispatch(setDiagnostics(this.view.state, diagnostics))
  }
  private async completions(context: CompletionContext): Promise<CompletionResult | null> {
    if (this.readonly) return null
    const local = this.language === 'ny' ? nyLocalCompletions(context) : matrixLocalCompletions(context)
    if (!local && !context.explicit) return null
    const outcome = await this.query('completion', context.pos)
    if (context.aborted || !outcome) return local
    const options: Completion[] = [...(local?.options ?? [])]
    for (const item of (Array.isArray(outcome.result.completions) ? outcome.result.completions : []).slice(0, 4096)) {
      if (!completionEdit(outcome.request.source, item)) continue
      options.push({ type: typeof item.kind === 'string' ? ({ field: 'property', parameter: 'variable' }[item.kind] ?? item.kind) : undefined, label: item.label.slice(0, 300), detail: typeof item.detail === 'string' ? item.detail.slice(0, 1000) : undefined,
        info: typeof item.documentation === 'string' ? () => { const node = document.createElement('div'); node.textContent = item.documentation!.slice(0, 65536); return node } : undefined,
        boost: 20,
        apply: (view) => {
          if (this.version !== outcome.request.version || view.state.doc.toString() !== outcome.request.source) return
          const edit = completionEdit(outcome.request.source, item)
          if (edit) view.dispatch({ changes: edit, selection: { anchor: edit.from + edit.insert.length }, userEvent: 'input.complete' })
        },
      })
    }
    return { from: local?.from ?? context.pos, options, validFor: () => false }
  }
  private fallbackInput(event: Event) { this.source = (event.target as HTMLTextAreaElement).value; this.version++; this.syncFallback(); this.emitChange() }
  render() { return html`
    <div class="toolbar"><span class="label">${this.label} / ${this.language}</span><span class="tools"><button type="button" @click=${() => void this.analyze('diagnostics')}>Check</button><button type="button" title="Ctrl/Cmd+Shift+Space" @click=${() => void this.analyze('signature')}>Signature</button></span></div>
    <div class="fallback" ?hidden=${this.ready} @input=${this.fallbackInput}><slot><textarea aria-label=${this.label} .value=${this.source} ?readonly=${this.readonly}></textarea></slot></div>
    <div class="editor" ?hidden=${!this.ready}></div>
    ${this.signature ? html`<div class="signature" role="status">${this.signature}</div>` : ''}
    <div class="status" role="status" aria-live="polite">${this.status}</div>` }
}
if (!customElements.get('ds-code-editor')) customElements.define('ds-code-editor', DisplacerCodeEditor)
declare global { interface HTMLElementTagNameMap { 'ds-code-editor': DisplacerCodeEditor } }
