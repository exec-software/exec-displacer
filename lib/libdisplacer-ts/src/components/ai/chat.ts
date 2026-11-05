import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

/* ───────── Chat Bubble ───────── */

export class DisplacerChatBubble extends LitElement {
  static styles = css`
    :host { display: flex; width: 100%; }
    .bubble-row { display: flex; width: 100%; gap: 10px; align-items: flex-start; margin-bottom: 14px; }
    .avatar {
      width: 27px; height: 27px; border-radius: 999px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.64rem; font-weight: 700;
      color: #f8fafc;
      background: var(--ds-bg-surface-alt, #1f2937);
      border: 1px solid var(--ds-border, #334155);
    }
    .avatar.user { background: var(--ds-primary, #4f46e5); border-color: color-mix(in srgb, var(--ds-primary, #4f46e5) 65%, transparent); }
    .avatar.assistant { background: var(--ds-accent, #10a37f); border-color: color-mix(in srgb, var(--ds-accent, #10a37f) 70%, transparent); }
    .bubble {
      padding: 10px 12px 12px;
      border-radius: 8px;
      font-size: 0.89rem;
      line-height: 1.52;
      max-width: min(88%, 840px);
      word-wrap: break-word;
      position: relative;
      border: 1px solid transparent;
    }
    .bubble.user {
      background: var(--ds-chat-user-bg, rgba(16, 163, 127, 0.22));
      color: var(--ds-chat-user-fg, var(--ds-fg-default, #e2e8f0));
      border-color: color-mix(in srgb, var(--ds-primary, #10a37f) 35%, transparent);
      margin-left: auto;
    }
    .bubble.assistant {
      background: var(--ds-chat-assistant-bg, var(--ds-bg-surface, #111827));
      color: var(--ds-fg-default, #e2e8f0);
      border-color: var(--ds-chat-assistant-border, var(--ds-border, #334155));
    }
    .bubble.system {
      background: var(--ds-chat-system-bg, var(--ds-bg-surface-alt, #1f2937));
      color: var(--ds-chat-system-fg, var(--ds-fg-muted, #94a3b8));
      border-radius: 8px;
      font-size: 0.82rem;
      text-align: left;
      max-width: 100%;
      margin: 0 auto;
    }
    .bubble.streaming { border-color: var(--ds-primary, #4f46e5); }
    .time { font-size: 0.64rem; color: var(--ds-fg-subtle, #64748b); margin-top: 6px; }
    .actions { display: flex; gap: 4px; margin-top: 6px; opacity: 0.2; transition: opacity 0.15s; }
    :host(:hover) .actions { opacity: 1; }
    .actions button {
      background: none; border: 1px solid var(--ds-border, #504945); cursor: pointer;
      font-size: 0.7rem; color: var(--ds-fg-muted, #a89984); padding: 2px 8px; border-radius: 4px;
      font-family: inherit; line-height: 1.2;
    }
    .actions button:hover { background: rgba(255,255,255,0.03); color: var(--ds-fg-default, #e2e8f0); border-color: var(--ds-fg-muted, #a89984); }
    .actions button.stop-btn { color: var(--ds-error, #ef4444); border-color: rgba(239, 68, 68, 0.35); }
    .actions button.stop-btn:hover { color: var(--ds-error, #ef4444); border-color: var(--ds-error, #ef4444); }
    ::slotted(.thinking) {
      display: block;
      margin: 6px 0;
      padding: 8px 11px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      font-size: 0.8rem;
      color: var(--ds-fg-muted, #a89984);
      font-style: italic;
    }
    ::slotted(.tool-call) {
      display: block;
      margin: 6px 0;
      padding: 6px 10px;
      background: rgba(255,255,255,0.02);
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.75rem;
      border-left: 2px solid var(--ds-accent, #d65d0e);
    }
  `

  @property({ type: String }) role: 'user' | 'assistant' | 'system' = 'assistant'
  @property({ type: String }) time = ''
  @property({ type: Boolean }) streaming = false
  @property({ type: Boolean }) showAvatar = true

  dispatchCopy() {
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null
    const nodes = slot?.assignedNodes({ flatten: true }) || []
    const text = nodes.map(n => n.textContent || '').join('').trim()
    if (text) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    this.dispatchEvent(new CustomEvent('ds-copy', { bubbles: true, composed: true, detail: { text } }))
  }

  dispatchEdit() {
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null
    const nodes = slot?.assignedNodes({ flatten: true }) || []
    const text = nodes.map(n => n.textContent || '').join('').trim()
    this.dispatchEvent(new CustomEvent('ds-edit', { bubbles: true, composed: true, detail: { text } }))
  }

  dispatchRetry() {
    this.dispatchEvent(new CustomEvent('ds-retry', { bubbles: true, composed: true }))
  }

  dispatchStop() {
    this.dispatchEvent(new CustomEvent('ds-stop', { bubbles: true, composed: true }))
  }

  render(): TemplateResult {
    const isUser = this.role === 'user'
    const isSystem = this.role === 'system'
    return html`
      <div class="bubble-row" style="${isUser ? 'flex-direction:row-reverse' : ''}">
        ${this.showAvatar && !isSystem ? html`<div class="avatar ${this.role}">${isUser ? 'U' : 'A'}</div>` : ''}
        <div>
          <div class="bubble ${this.role} ${this.streaming ? 'streaming' : ''}">
            <slot></slot>
            <div class="time">${this.time}</div>
          </div>
          <div class="actions">
            ${this.streaming ? html`<button class="stop-btn" @click=${this.dispatchStop}>Stop</button>` : ''}
            <button @click=${this.dispatchCopy}>Copy</button>
            ${!isUser ? html`<button @click=${this.dispatchEdit}>Edit</button><button @click=${this.dispatchRetry}>Retry</button>` : ''}
          </div>
        </div>
      </div>
    `
  }
}
customElements.define('ds-chat-bubble', DisplacerChatBubble)

/* ───────── Typing Indicator ───────── */

export class DisplacerTypingIndicator extends LitElement {
  static styles = css`
    :host { display: flex; align-items: center; gap: 4px; padding: 10px 14px; }
    .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--ds-primary, #4f46e5);
      animation: pulse 1.4s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
      30% { opacity: 1; transform: scale(1.2); }
    }
  `

  render(): TemplateResult {
    return html`<div class="dot"></div><div class="dot"></div><div class="dot"></div>`
  }
}
customElements.define('ds-typing', DisplacerTypingIndicator)

/* ───────── Model Badge ───────── */

export class DisplacerModelBadge extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 6px;
      font-size: 0.75rem;
      background: var(--ds-bg-surface-alt, #1f2937);
      border: 1.5px solid var(--ds-border, #504945);
      color: var(--ds-fg-default, #ebdbb2);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot.online { background: var(--ds-success, #22c55e); }
    .dot.busy { background: var(--ds-warning, #f59e0b); }
    .dot.error { background: var(--ds-error, #ef4444); }
    .quant { font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: var(--ds-bg-surface-alt, #32302f); }
    .ctx { color: var(--ds-fg-muted, #a89984); font-size: 0.65rem; }
  `

  @property({ type: String }) model = ''
  @property({ type: String }) quant = ''
  @property({ type: Number }) context = 0
  @property({ type: String }) status: 'online' | 'busy' | 'error' = 'online'

  render(): TemplateResult {
    return html`
      <span class="badge">
        <span class="dot ${this.status}"></span>
        ${this.model}
        ${this.quant ? html`<span class="quant">${this.quant}</span>` : ''}
        ${this.context ? html`<span class="ctx">${(this.context/1024).toFixed(0)}K</span>` : ''}
      </span>`
  }
}
customElements.define('ds-model-badge', DisplacerModelBadge)

/* ───────── Chat Meta (per-message telemetry) ─────────
   A compact, fixed-order chip row of per-message
   debug telemetry (source, latency, chars, words, fn%, …) rendered under a chat bubble. Fixed field
   order turns stacked messages into scannable vertical columns for cross-turn pattern-matching. */

export class DisplacerChatMeta extends LitElement {
  static styles = css`
    :host { display: flex; flex-wrap: wrap; gap: 4px 10px; margin: 3px 0 0 2px;
      font-family: var(--ds-font-mono, ui-monospace, monospace); font-size: 0.62rem;
      color: var(--ds-fg-muted, #7c6f64); }
    .f i { font-style: normal; color: var(--ds-fg-subtle, #a89984); margin-right: 3px;
      text-transform: uppercase; letter-spacing: 0.04em; }
    .f b { font-weight: 500; color: var(--ds-fg-muted, #7c6f64); font-variant-numeric: tabular-nums; }
    :host([highlight]) .f b { color: var(--ds-primary, #b16286); }
  `
  /** stats: ordered [label, value] pairs, e.g. [["src","demo"],["lat","1.3s"],["fn%","64%"]] */
  @property({ type: Array }) stats: Array<[string, string | number]> = []

  render(): TemplateResult {
    return html`${this.stats.map(([k, v]) => html`<span class="f"><i>${k}</i><b>${v}</b></span>`)}`
  }
}
customElements.define('ds-chat-meta', DisplacerChatMeta)

declare global {
  interface HTMLElementTagNameMap {
    'ds-chat-bubble': DisplacerChatBubble
    'ds-typing': DisplacerTypingIndicator
    'ds-model-badge': DisplacerModelBadge
    'ds-chat-meta': DisplacerChatMeta
  }
}
