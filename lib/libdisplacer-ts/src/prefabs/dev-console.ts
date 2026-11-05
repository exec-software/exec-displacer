import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'

const MAX_HISTORY = 200
const MAX_LINES = 500

interface LogEntry { text: string; level: 'info' | 'warn' | 'error' | 'cmd' | 'out'; time: number }

/**
 * One turn in the agent transcript. `tool` entries are kept as their own role rather than
 * folded into the assistant text: a developer watching an agent work needs to see WHICH
 * tool ran and what it returned, and prose that merely claims a file was written is the
 * single most common way an agent's output misleads.
 */
interface AgentMsg { role: 'user' | 'assistant' | 'tool' | 'error'; text: string; name?: string }

export class DisplacerDevConsole extends LitElement {
  static styles = css`
    :host { display: block; position: fixed; top: 0; left: 0; right: 0; z-index: 100; pointer-events: none; }
    :host([open]) { pointer-events: auto; }
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.3); opacity: 0; transition: opacity .2s; pointer-events: none; }
    :host([open]) .backdrop { opacity: 1; pointer-events: auto; }
    .console {
      position: relative; background: rgba(17,17,17,.96); border-bottom: 1px solid #333;
      color: #ddd; font-family: var(--ds-mono, monospace); font-size: 13px;
      max-height: 0; overflow: hidden; transition: max-height .25s ease;
      display: flex; flex-direction: column;
    }
    :host([open]) .console { max-height: 50vh; }
    .header {
      display: flex; align-items: center; gap: 8px; padding: 6px 12px;
      background: #1a1a1a; border-bottom: 1px solid #333; flex-shrink: 0;
    }
    .header .title { font-weight: 600; font-size: 12px; color: #b16286; }
    .header .tabs { display: flex; gap: 2px; margin-left: 12px; }
    .header .tab {
      padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;
      color: #888; border: 1px solid transparent;
    }
    .header .tab:hover { color: #ccc; }
    .header .tab.active { background: #333; color: #fff; border-color: #555; }
    .header .actions { margin-left: auto; display: flex; gap: 4px; }
    .header button {
      background: none; border: 1px solid #444; color: #888;
      padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-family: inherit;
    }
    .header button:hover { color: #fff; border-color: #666; }
    .output {
      flex: 1; overflow-y: auto; padding: 8px 12px; min-height: 0;
      display: flex; flex-direction: column; gap: 1px;
    }
    .output .line { white-space: pre-wrap; word-break: break-all; line-height: 1.4; }
    .output .line.info { color: #a89984; }
    .output .line.warn { color: #d79921; }
    .output .line.error { color: #cc241d; }
    .output .line.cmd { color: #b16286; }
    .output .line.out { color: #ebdbb2; }
    .output .line .ts { color: #555; margin-right: 8px; font-size: 10px; }
    .input-row {
      display: flex; align-items: center; padding: 4px 12px 8px;
      border-top: 1px solid #333; flex-shrink: 0;
    }
    .prompt { color: #b16286; margin-right: 6px; font-weight: 600; white-space: nowrap; }
    .input-row input {
      flex: 1; background: none; border: none; outline: none;
      color: #ebdbb2; font-family: inherit; font-size: 13px; padding: 2px 0;
    }
    .dashboard {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
      min-height: 0;
    }
    .dashboard .metric-row { display: flex; gap: 12px; }
    .dashboard .metric {
      flex: 1; background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
      padding: 12px; display: flex; flex-direction: column; gap: 4px;
    }
    .dashboard .metric .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .dashboard .metric .value { font-size: 18px; font-weight: 700; color: #ebdbb2; }
    .dashboard .metric .sub { font-size: 10px; color: #888; }

    /* agent */
    .agent { flex: 1; overflow-y: auto; padding: 10px 12px; min-height: 0;
             display: flex; flex-direction: column; gap: 8px; font-family: var(--ds-sans, system-ui, sans-serif); }
    .agent .msg { line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .agent .msg.user { color: #ebdbb2; }
    .agent .msg.user::before { content: 'you '; color: #666; font-size: 10px; }
    .agent .msg.assistant { color: #c8c0b0; }
    .agent .msg.error { color: #cc241d; font-size: 12px; }
    .agent .tool {
      border-left: 2px solid #504945; padding: 4px 8px; margin: 2px 0;
      font-family: var(--ds-mono, monospace); font-size: 11px; color: #83a598;
      background: rgba(255,255,255,.02); white-space: pre-wrap; word-break: break-all;
    }
    .agent .tool b { color: #b16286; font-weight: 600; }
    .agent .empty { color: #665c54; font-size: 12px; }
    .agent-status { margin-left: auto; font-size: 10px; color: #665c54; }
    .con-disabled { color: #d79921; font-size: 12px; line-height: 1.6; padding: 4px 0; }
    .busy { color: #665c54; font-size: 11px; }
  `

  @property({ type: Boolean, reflect: true }) open = false
  @property({ type: String }) mode: 'dashboard' | 'console' | 'system' | 'agent' = 'console'
  /** Optional health-monitor base URL; monitoring stays idle until configured. */
  @property({ type: String }) monitorUrl = ''

  /**
   * Base for the console and agent endpoints. The component talks to these itself, so a
   * host gets a working shell and a working agent by dropping the tag in — no wiring.
   *
   * Expected host-provided HTTP API contract:
   *   GET  {apiBase}/console        -> { enabled, reason }
   *   POST {apiBase}/console        { command } -> { stdout, stderr, code, ms, error? }
   *   GET  {apiBase}/agent/status   -> { tools[], model, problems[] }
   *   POST {apiBase}/agent/chat     { message } -> SSE of { kind, ... }
   *   POST {apiBase}/agent/reset
   *
   * A host that wants to run commands itself calls preventDefault() on `console-cmd`.
   */
  @property({ type: String }) apiBase = '/api'

  @state() private _history: string[] = []
  @state() private _historyIdx = -1
  @state() private _lines: LogEntry[] = []
  @state() private _input = ''
  @state() private _commands: string[] = ['help','clear','log','ask','agent','status','models','tools','workspace','exit']
  @state() private _sysInfo: any = {}
  private _sysTimer = 0

  // ── agent ──────────────────────────────────────────────────────────────────
  @state() private _msgs: AgentMsg[] = []
  @state() private _agentBusy = false
  @state() private _agentInfo: { tools: string[]; model?: string; problems?: any[] } | null = null
  /** null = not asked yet; the console tab greys itself out rather than failing on submit */
  @state() private _gate: { enabled: boolean; reason: string } | null = null

  @query('input') private _inputEl!: HTMLInputElement
  @query('.output') private _outputEl!: HTMLDivElement

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('keydown', this._onKey)
  }
  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('keydown', this._onKey)
  }

  private _onKey = (e: KeyboardEvent) => {
    if (e.key === '`' || e.key === '~') {
      e.preventDefault()
      this.open = !this.open
      if (this.open) setTimeout(() => this._inputEl?.focus(), 100)
    }
    if (e.key === 'Escape' && this.open) { this.open = false }
  }

  render(): TemplateResult {
    return html`
      <div class="backdrop" @click=${() => { this.open = false }}></div>
      <div class="console">
        <div class="header">
          <span class="title">Dev Console</span>
          <div class="tabs">
            <span class="tab ${this.mode === 'console' ? 'active' : ''}" @click=${() => { this.mode = 'console' }}>Console</span>
            <span class="tab ${this.mode === 'agent' ? 'active' : ''}" @click=${() => { this.mode = 'agent'; this._fetchAgent() }}>Agent</span>
            <span class="tab ${this.mode === 'dashboard' ? 'active' : ''}" @click=${() => { this.mode = 'dashboard' }}>Dashboard</span>
            <span class="tab ${this.mode === 'system' ? 'active' : ''}" @click=${() => { this.mode = 'system'; this._fetchSystem() }}>System</span>
          </div>
          ${this.mode === 'agent' && this._agentInfo ? html`
            <span class="agent-status">
              ${this._agentInfo.tools.length} tools${this._agentInfo.model ? ' · ' + this._agentInfo.model : ''}
              ${this._agentInfo.problems?.length ? ' · ' + this._agentInfo.problems.length + ' MCP failed' : ''}
            </span>` : ''}
          <div class="actions">
            ${this.mode === 'agent'
              ? html`<button @click=${this._resetAgent}>Reset</button>`
              : html`<button @click=${this._clear}>Clear</button>`}
            <button @click=${() => { this.open = false }}>×</button>
          </div>
        </div>
        ${this.mode === 'dashboard' ? this._renderDashboard()
          : this.mode === 'system' ? this._renderSystem()
          : this.mode === 'agent' ? this._renderAgent()
          : this._renderConsole()}
        <div class="input-row">
          <span class="prompt">${this.mode === 'agent' ? '›' : ']'}</span>
          <input
            .value=${this._input}
            @input=${this._onInput}
            @keydown=${this._onInputKey}
            placeholder=${this.mode === 'agent'
              ? 'Ask the agent — it has tools and can read and edit files…'
              : 'Type a shell command, or ?question to ask the agent…'}
          />
        </div>
      </div>
    `
  }

  private _renderConsole(): TemplateResult {
    return html`
      <div class="output">
        ${this._lines.map(l => html`
          <div class="line ${l.level}"><span class="ts">${this._fmtTime(l.time)}</span>${l.text}</div>
        `)}
      </div>
    `
  }

  private _renderDashboard(): TemplateResult {
    return html`
      <div class="dashboard">
        <div class="metric-row">
          <div class="metric"><span class="label">Model</span><span class="value" id="dashModel">—</span><span class="sub">active</span></div>
          <div class="metric"><span class="label">Tools</span><span class="value" id="dashTools">—</span><span class="sub">MCP</span></div>
          <div class="metric"><span class="label">Tokens</span><span class="value" id="dashTokens">—</span><span class="sub">session</span></div>
        </div>
        <div class="metric-row">
          <div class="metric"><span class="label">Uptime</span><span class="value" id="dashUptime">—</span><span class="sub">server</span></div>
          <div class="metric"><span class="label">Cache</span><span class="value" id="dashCache">—</span><span class="sub">weights</span></div>
          <div class="metric"><span class="label">Sessions</span><span class="value" id="dashSessions">—</span><span class="sub">active</span></div>
        </div>
      </div>
    `
  }

  private _renderAgent(): TemplateResult {
    return html`
      <div class="agent">
        ${this._msgs.length ? '' : html`<div class="empty">
          One agent, one conversation, real MCP tools — for the work that is a conversation
          rather than a task. Ask it something.
        </div>`}
        ${this._msgs.map(m => m.role === 'tool'
          ? html`<div class="tool"><b>${m.name}</b> ${m.text}</div>`
          : html`<div class="msg ${m.role}">${m.text}</div>`)}
        ${this._agentBusy ? html`<div class="busy">thinking…</div>` : ''}
      </div>
    `
  }

  // ── the agent ──────────────────────────────────────────────────────────────

  private async _fetchAgent() {
    try {
      const r = await fetch(`${this.apiBase}/agent/status`)
      if (r.ok) this._agentInfo = await r.json()
    } catch { this._agentInfo = null }
  }

  /**
   * Send one turn and stream the reply.
   *
   * `inline` renders into the console log instead of the agent transcript — that is the
   * `?question` path, so you can ask something without leaving the shell.
   */
  private async _ask(text: string, inline = false) {
    if (this._agentBusy) {
      if (inline) this.log('agent is still working on the previous turn', 'warn')
      return
    }
    this._agentBusy = true
    if (!inline) this._msgs = [...this._msgs, { role: 'user', text }]
    try {
      const r = await fetch(`${this.apiBase}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({} as any))
        this._push({ role: 'error', text: j.error || `HTTP ${r.status}` }, inline)
        return
      }
      const reader = r.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      let streaming = false          // is the tail message an assistant turn we append to?
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''      // a chunk can split a frame; keep the remainder
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          let e: any
          try { e = JSON.parse(line.slice(5).trim()) } catch { continue }
          if (e.kind === 'token') {
            if (inline) { this.log(e.text, 'out'); continue }
            if (streaming) {
              const last = this._msgs[this._msgs.length - 1]
              this._msgs = [...this._msgs.slice(0, -1), { ...last, text: last.text + e.text }]
            } else {
              this._msgs = [...this._msgs, { role: 'assistant', text: e.text }]
              streaming = true
            }
          } else if (e.kind === 'tool_call') {
            streaming = false        // a tool call ends the current prose block
            this._push({ role: 'tool', name: e.name, text: `→ ${String(e.args).slice(0, 300)}` }, inline)
          } else if (e.kind === 'tool_result') {
            this._push({ role: 'tool', name: e.name, text: `← ${String(e.result).slice(0, 600)}` }, inline)
          } else if (e.kind === 'error') {
            streaming = false
            this._push({ role: 'error', text: e.message }, inline)
          }
        }
      }
    } catch (err) {
      this._push({ role: 'error', text: String((err as Error).message || err) }, inline)
    } finally {
      this._agentBusy = false
      this._scrollAgent()
      this._fetchAgent()
    }
  }

  private _push(m: AgentMsg, inline: boolean) {
    if (inline) {
      this.log(m.role === 'tool' ? `${m.name} ${m.text}` : m.text,
               m.role === 'error' ? 'error' : m.role === 'tool' ? 'info' : 'out')
      return
    }
    this._msgs = [...this._msgs, m]
    this._scrollAgent()
  }

  private _scrollAgent() {
    setTimeout(() => {
      const el = this.renderRoot.querySelector('.agent') as HTMLElement | null
      if (el) el.scrollTop = el.scrollHeight
    }, 30)
  }

  /** Reset the server-side conversation as well as the local transcript. */
  private async _resetAgent() {
    this._msgs = []
    try { await fetch(`${this.apiBase}/agent/reset`, { method: 'POST' }) } catch { /* local clear still stands */ }
    this._fetchAgent()
  }

  // ── the shell ──────────────────────────────────────────────────────────────

  /**
   * Run a command server-side. Cached gate check, so a disabled console explains itself
   * once rather than putting a round-trip in front of every keystroke-to-output.
   */
  private async _runShell(cmd: string) {
    if (!this._gate) {
      this._gate = await fetch(`${this.apiBase}/console`).then(r => r.json())
        .catch(() => ({ enabled: false, reason: 'console endpoint unreachable' }))
    }
    if (!this._gate!.enabled) { this.log(this._gate!.reason, 'error'); return }
    try {
      const r = await fetch(`${this.apiBase}/console`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
      const j = await r.json()
      if (j.error && !j.stdout && !j.stderr) { this.log(j.error, 'error'); return }
      if (j.stdout) this.log(String(j.stdout).replace(/\n+$/, ''), 'out')
      if (j.stderr) this.log(String(j.stderr).replace(/\n+$/, ''), 'error')
      this.log(`exit ${j.code} · ${j.ms}ms${j.error ? ' · ' + j.error : ''}`, 'info')
    } catch (e) {
      this.log(String((e as Error).message || e), 'error')
    }
  }

  private _onInput(e: InputEvent) { this._input = (e.target as HTMLInputElement).value }
  private _onInputKey(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); this._execute(); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); this._navHistory(-1); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); this._navHistory(1); return }
    if (e.key === 'Tab') { e.preventDefault(); this._autocomplete(); return }
  }

  private _execute() {
    const cmd = this._input.trim()
    if (!cmd) return
    this._history.push(cmd)
    // MAX_HISTORY was declared but never enforced — the array grew without bound.
    if (this._history.length > MAX_HISTORY) this._history.shift()
    this._historyIdx = -1
    this._input = ''
    this._syncInput()
    this.log(cmd, 'cmd')

    // In the Agent tab everything is a message; there is no shell there.
    if (this.mode === 'agent') { this._ask(cmd); return }

    // `?question` / `ask question` — reach the agent WITHOUT leaving the shell. The answer
    // renders inline in the console log, which is the point: you are mid-task, you have a
    // question, and you should not have to change context to ask it.
    const inline = cmd.startsWith('?') ? cmd.slice(1).trim()
      : cmd.startsWith('ask ') ? cmd.slice(4).trim() : null
    if (inline) { this.log('asking the agent…', 'info'); this._ask(inline, true); return }

    // CANCELABLE: a host that executes commands itself calls preventDefault() to claim
    // one, so its output is not followed by our fallback. Hosts that ignore the event get
    // the built-in shell below.
    const claimed = !this.dispatchEvent(new CustomEvent('console-cmd', {
      detail: { command: cmd }, bubbles: true, composed: true, cancelable: true,
    }))
    // Built-ins run either way — `clear` and `exit` are console controls, not commands a
    // host would want to intercept.
    if (cmd === 'clear') { this._lines = [] }
    else if (cmd === 'help') {
      this.log('Commands: ' + this._commands.join(', '), 'out')
      this.log('?<question>  or  ask <question>   — put a question to the agent, inline', 'out')
      this.log('agent                             — switch to the Agent tab', 'out')
      this.log('anything else                     — runs as a shell command on the server', 'out')
    }
    else if (cmd === 'exit') { this.open = false }
    else if (cmd === 'agent') { this.mode = 'agent'; this._fetchAgent() }
    else if (cmd.startsWith('log ')) { this.log(cmd.slice(4), 'out') }
    else if (!claimed) { this._runShell(cmd) }
  }

  /**
   * Push `_input` into the DOM by hand.
   *
   * `.value=${this._input}` alone is not enough: Lit dirty-checks against the value IT
   * last committed, and typing changes the DOM without changing that. So submitting a
   * command (which resets `_input` to the value Lit already believes is there) never
   * clears the box, and history/autocomplete can silently no-op for the same reason.
   */
  private _syncInput() { if (this._inputEl) this._inputEl.value = this._input }

  private _navHistory(dir: number) {
    if (this._history.length === 0) return
    this._historyIdx += dir
    if (this._historyIdx < 0) this._historyIdx = -1
    if (this._historyIdx >= this._history.length) this._historyIdx = this._history.length - 1
    this._input = this._historyIdx >= 0 ? this._history[this._history.length - 1 - this._historyIdx] : ''
    this._syncInput()
    this.requestUpdate()
  }

  private _autocomplete() {
    const partial = this._input.toLowerCase()
    const matches = this._commands.filter(c => c.startsWith(partial))
    if (matches.length === 1) { this._input = matches[0]; this._syncInput(); this.requestUpdate() }
  }

  private _clear() { this._lines = []; this.requestUpdate() }

  /** Public API — add a log line */
  log(text: string, level: LogEntry['level'] = 'info') {
    this._lines.push({ text, level, time: Date.now() })
    if (this._lines.length > MAX_LINES) this._lines.shift()
    this.requestUpdate()
    // Auto-scroll
    setTimeout(() => {
      if (this._outputEl) this._outputEl.scrollTop = this._outputEl.scrollHeight
    }, 50)
  }

  private _fmtTime(ts: number): string {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  }

  private async _fetchSystem() {
    if (!this.monitorUrl.trim()) return
    try {
      const r = await fetch(`${this.monitorUrl}/health`)
      if (r.ok) this._sysInfo = await r.json()
    } catch {}
    if (this.mode === 'system') {
      clearTimeout(this._sysTimer)
      this._sysTimer = window.setTimeout(() => this._fetchSystem(), 3000)
    }
  }

  private _renderSystem(): TemplateResult {
    const s = this._sysInfo || {}
    const gpu = s.gpu || {}
    return html`
      <div class="dashboard">
        <div class="metric-row">
          <div class="metric"><span class="label">GPU Temp</span><span class="value">${gpu.temp ?? '—'}°C</span><span class="sub">${gpu.name ?? 'GPU'}</span></div>
          <div class="metric"><span class="label">VRAM</span><span class="value">${gpu.vram_used ?? '—'} / ${gpu.vram_total ?? '—'}</span><span class="sub">${gpu.vram_pct ? gpu.vram_pct + '%' : ''}</span></div>
          <div class="metric"><span class="label">CPU Usage</span><span class="value">${s.cpu_pct ?? '—'}%</span><span class="sub">${s.cpu_cores ?? ''} cores</span></div>
        </div>
        <div class="metric-row">
          <div class="metric"><span class="label">RAM</span><span class="value">${s.ram_used ?? '—'} / ${s.ram_total ?? '—'}</span><span class="sub">${s.ram_pct ? s.ram_pct + '%' : ''}</span></div>
          <div class="metric"><span class="label">Engine</span><span class="value">${s.engine ?? '—'}</span><span class="sub">${s.status ?? ''}</span></div>
          <div class="metric"><span class="label">Model</span><span class="value" style="font-size:12px;">${s.default_model ?? s.model ?? '—'}</span><span class="sub">loaded</span></div>
        </div>
        <div style="font-size:10px;color:#555;margin-top:8px;">Monitoring: ${this.monitorUrl || 'configure monitorUrl to connect'} · ${Object.keys(s).length ? 'connected' : 'no data'}</div>
      </div>
    `
  }
}

customElements.define('ds-dev-console', DisplacerDevConsole)

declare global {
  interface HTMLElementTagNameMap {
    'ds-dev-console': DisplacerDevConsole
  }
}
