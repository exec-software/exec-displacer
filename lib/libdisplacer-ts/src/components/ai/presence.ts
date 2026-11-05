import { LitElement, html, css, type TemplateResult, nothing } from 'lit'
import { property } from 'lit/decorators.js'

export type PresenceState = 'awake' | 'sleeping' | 'offline'
export type PresenceSize = 'sm' | 'md'

/**
 * ds-agent-presence — public-facing presence badge for a hosted agent.
 *
 * A calm, honest status sentence: "agent is awake" · "agent is sleeping" ·
 * "agent is offline". Sleeping is a *healthy* state (the agent is consolidating),
 * so it renders in sapphire with a breathing moon — never as an alarm.
 * Offline is quiet gray, not error red: away, not broken.
 *
 * An optional progress meter (0–1) shows consolidation / drowsiness progress
 * when the host knows it; hidden otherwise. At size `sm` the note is omitted
 * (tight headers / mobile).
 */
export class DisplacerAgentPresence extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    .badge {
      position: relative; display: inline-flex; align-items: center; gap: 7px;
      border-radius: 999px; border: 1.5px solid var(--ds-border, #504945);
      background: var(--ds-bg-surface, #282828); color: var(--ds-fg-default, #ebdbb2);
      font-family: 'Inter', system-ui, sans-serif;
      overflow: hidden;
    }
    .size-md { padding: 5px 13px; font-size: 0.78rem; }
    .size-sm { padding: 3px 10px; font-size: 0.68rem; }

    .glyph { flex: none; display: inline-flex; align-items: center; justify-content: center; }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .moon { font-size: 0.85em; line-height: 1; transform: translateY(-0.5px); }
    .hollow { width: 6px; height: 6px; border-radius: 50%; border: 1.5px solid currentColor; }

    .awake   { color: var(--ds-semantic-success, #689d6a); }
    .sleeping { color: var(--ds-semantic-info, #458588); }
    .offline { color: var(--ds-fg-muted, #a89984); }

    .awake .dot { background: var(--ds-semantic-success, #689d6a); }
    .offline .hollow { border-color: var(--ds-fg-muted, #a89984); }

    .words { color: var(--ds-fg-default, #ebdbb2); white-space: nowrap; }
    .words .who { font-weight: 600; }
    .note { color: var(--ds-fg-muted, #a89984); white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; max-width: 320px; }

    .meter { position: absolute; left: 12px; right: 12px; bottom: 2.5px; height: 2px;
      border-radius: 2px; background: var(--ds-bg-surface-alt, #3c3836); }
    .meter > i { display: block; height: 100%; border-radius: 2px; background: currentColor;
      transition: width 0.6s ease; }
    .size-md.has-meter { padding-bottom: 8px; }
    .size-sm.has-meter { padding-bottom: 6px; }

    @media (prefers-reduced-motion: no-preference) {
      .moon { animation: breathe 3.2s ease-in-out infinite; }
      @keyframes breathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
    }
  `

  @property({ type: String }) state: PresenceState = 'awake'
  @property({ type: String }) label = 'agent'
  @property({ type: String }) note = ''
  @property({ type: Number }) progress = 0
  @property({ type: String }) size: PresenceSize = 'md'

  private renderGlyph(): TemplateResult {
    if (this.state === 'awake') return html`<span class="glyph"><span class="dot"></span></span>`
    if (this.state === 'sleeping') return html`<span class="glyph moon">☾</span>`
    return html`<span class="glyph"><span class="hollow"></span></span>`
  }

  render(): TemplateResult {
    const p = Math.min(1, Math.max(0, this.progress || 0))
    return html`
      <span class="badge size-${this.size} ${this.state} ${p > 0 ? 'has-meter' : ''}">
        ${this.renderGlyph()}
        <span class="words"><span class="who">${this.label}</span> is ${this.state}</span>
        ${this.size === 'md' && this.note ? html`<span class="note">· ${this.note}</span>` : nothing}
        ${p > 0 ? html`<span class="meter"><i style="width:${(p * 100).toFixed(1)}%"></i></span>` : nothing}
      </span>
    `
  }
}

customElements.define('ds-agent-presence', DisplacerAgentPresence)

declare global {
  interface HTMLElementTagNameMap {
    'ds-agent-presence': DisplacerAgentPresence
  }
}
