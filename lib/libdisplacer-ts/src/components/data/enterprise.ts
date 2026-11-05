import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

/* ───────── Log Viewer ───────── */

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: string
  source?: string
}

export class DisplacerLogViewer extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; height: 100%; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; background: var(--ds-bg-page, #1d2021); border-radius: 8px; overflow: hidden; border: 1.5px solid var(--ds-border, #504945); }
    .toolbar { display: flex; gap: 8px; padding: 6px 10px; background: var(--ds-bg-surface, #282828); border-bottom: 1px solid var(--ds-border, #504945); flex-wrap: wrap; }
    .toolbar select { background: var(--ds-bg-surface-alt, #3c3836); color: var(--ds-fg-default, #ebdbb2); border: 1px solid var(--ds-border, #504945); border-radius: 4px; padding: 2px 6px; font-size: 0.7rem; font-family: inherit; }
    .toolbar input { background: var(--ds-bg-surface-alt, #3c3836); color: var(--ds-fg-default, #ebdbb2); border: 1px solid var(--ds-border, #504945); border-radius: 4px; padding: 2px 6px; font-size: 0.7rem; flex: 1; min-width: 100px; font-family: inherit; }
    .stream { flex: 1; overflow-y: auto; padding: 4px 0; scrollbar-width: thin; }
    .entry { display: flex; gap: 8px; padding: 2px 10px; line-height: 1.5; transition: background 0.1s; }
    .entry:hover { background: rgba(177,98,134,0.05); }
    .time { color: #a89984; flex-shrink: 0; }
    .level { width: 40px; flex-shrink: 0; font-weight: 600; }
    .level.debug { color: #a89984; }
    .level.info { color: #83a598; }
    .level.warn { color: #fabd2f; }
    .level.error { color: #fb4934; }
    .msg { flex: 1; word-break: break-all; color: var(--ds-fg-default, #ebdbb2); }
    .source { color: #a89984; font-size: 0.65rem; margin-left: 8px; }
    .badge { font-size: 0.6rem; padding: 0 6px; border-radius: 3px; font-weight: 600; }
    .badge.debug { color: #a89984; } .badge.info { color: #83a598; } .badge.warn { color: #fabd2f; } .badge.error { color: #fb4934; }
  `

  @property({ type: Array }) entries: LogEntry[] = []
  @property({ type: Number }) maxEntries = 1000
  @state() private filterLevel = 'all'
  @state() private filterText = ''

  private get _filtered() {
    return this.entries.filter(e => {
      if (this.filterLevel !== 'all' && e.level !== this.filterLevel) return false
      if (this.filterText && !e.message.toLowerCase().includes(this.filterText.toLowerCase())) return false
      return true
    }).slice(-this.maxEntries)
  }

  render(): TemplateResult {
    return html`
      <div class="toolbar">
        <select @change="${(e: Event) => this.filterLevel = (e.target as HTMLSelectElement).value}">
          <option value="all">All</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
        <input placeholder="Search logs..." @input="${(e: Event) => this.filterText = (e.target as HTMLInputElement).value}" />
        <span style="font-size:0.65rem;color:#a89984;align-self:center;">${this._filtered.length} entries</span>
      </div>
      <div class="stream">
        ${this._filtered.map(e => html`
          <div class="entry">
            <span class="time">${e.timestamp}</span>
            <span class="level ${e.level}"><span class="badge ${e.level}">${e.level.toUpperCase()}</span></span>
            <span class="msg">${e.message}</span>
            ${e.source ? html`<span class="source">${e.source}</span>` : ''}
          </div>`)}
        ${this._filtered.length === 0 ? html`<div style="padding:20px;text-align:center;color:#a89984;">No log entries match the current filter.</div>` : ''}
      </div>`
  }
}
customElements.define('ds-log-viewer', DisplacerLogViewer)

/* ───────── Filter Bar ───────── */

export class DisplacerFilterBar extends LitElement {
  static styles = css`
    :host { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-family: 'Inter', system-ui, sans-serif; }
    .search { flex: 1; min-width: 140px; }
    .search input { width: 100%; padding: 6px 10px; border: 1.5px solid var(--ds-border, #bdae93); border-radius: 6px; font-size: 0.8rem; font-family: inherit; background: var(--ds-bg-surface, #ebdbb2); color: var(--ds-fg-default, #3c3836); outline: none; }
    .search input:focus { border-color: var(--ds-primary, #b16286); box-shadow: 0 0 0 2px rgba(177,98,134,0.15); }
    .search input::placeholder { color: var(--ds-fg-muted, #7c6f64); }
    ::slotted(ds-pill) { cursor: pointer; }
  `
  render(): TemplateResult {
    return html`
      <div class="search"><input type="text" placeholder="Search..." @input="${(e: Event) => this.dispatchEvent(new CustomEvent('search', {detail: {query: (e.target as HTMLInputElement).value}}))}" /></div>
      <slot></slot>`
  }
}
customElements.define('ds-filter-bar', DisplacerFilterBar)

/* ───────── User Avatar ───────── */

export class DisplacerUserAvatar extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: 8px; font-family: 'Inter', system-ui, sans-serif; }
    .avatar {
      width: var(--size, 32px); height: var(--size, 32px); border-radius: 50%;
      background: var(--ds-primary, #b16286); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: calc(var(--size, 32px) * 0.4);
      flex-shrink: 0; overflow: hidden;
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .online { position: relative; }
    .online::after {
      content: ''; position: absolute; bottom: 0; right: 0;
      width: calc(var(--size, 32px) * 0.28); height: calc(var(--size, 32px) * 0.28);
      border-radius: 50%; border: 2px solid var(--ds-bg-page, #fbf1c7);
    }
    .online.ok::after { background: #689d6a; }
    .online.away::after { background: #d79921; }
    .online.busy::after { background: #cc241d; }
    .info { display: flex; flex-direction: column; }
    .name { font-size: 0.8rem; font-weight: 500; }
    .detail { font-size: 0.65rem; color: var(--ds-fg-muted, #7c6f64); }
    .group { display: flex; }
    .group .avatar { margin-left: -8px; border: 2px solid var(--ds-bg-page, #fbf1c7); }
    .group .avatar:first-child { margin-left: 0; }
  `
  @property({ type: String }) name = ''
  @property({ type: String }) detail = ''
  @property({ type: String }) src = ''
  @property({ type: String }) status: 'ok' | 'away' | 'busy' | '' = ''
  @property({ type: Number }) size = 32

  render(): TemplateResult {
    return html`
      <div class="avatar ${this.status ? `online ${this.status}` : ''}" style="--size: ${this.size}px">
        ${this.src ? html`<img src="${this.src}" alt="${this.name}" />` : html`${this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}`}
      </div>
      ${this.name ? html`<div class="info"><span class="name">${this.name}</span>${this.detail ? html`<span class="detail">${this.detail}</span>` : ''}</div>` : ''}<slot></slot>`
  }
}
customElements.define('ds-user-avatar', DisplacerUserAvatar)

/* ───────── Account Card ───────── */

export class DisplacerAccountCard extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; }
    .card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; background: var(--ds-bg-surface, #ebdbb2); border: 1.5px solid var(--ds-border, #bdae93); }
    .info { flex: 1; }
    .name { font-weight: 600; font-size: 0.9rem; }
    .email { font-size: 0.75rem; color: var(--ds-fg-muted, #7c6f64); }
    .meta { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
    .tag { font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: var(--ds-bg-surface-alt, #d5c4a1); color: var(--ds-fg-muted, #7c6f64); }
    .actions { display: flex; gap: 4px; }
  `
  @property({ type: String }) name = ''
  @property({ type: String }) email = ''
  @property({ type: String }) role = ''

  render(): TemplateResult {
    return html`
      <div class="card">
        <ds-user-avatar name="${this.name}" size="40"></ds-user-avatar>
        <div class="info">
          <div class="name">${this.name}</div>
          ${this.email ? html`<div class="email">${this.email}</div>` : ''}
          <div class="meta">${this.role ? html`<span class="tag">${this.role}</span>` : ''}<slot name="tags"></slot></div>
        </div>
        <div class="actions"><slot name="actions"></slot></div>
      </div>`
  }
}
customElements.define('ds-account-card', DisplacerAccountCard)
