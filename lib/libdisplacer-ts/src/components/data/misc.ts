import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type PillVariant = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info'

export class DisplacerPill extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    .pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 10px; border-radius: 999px;
      font-size: 0.7rem; font-weight: 500; white-space: nowrap;
      border: 1.5px solid transparent;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .default { background: var(--ds-bg-surface-alt, #d5c4a1); color: var(--ds-fg-default, #3c3836); }
    .primary { background: rgba(177,98,134,0.12); color: #b16286; border-color: rgba(177,98,134,0.2); }
    .accent { background: rgba(214,93,14,0.12); color: #d65d0e; border-color: rgba(214,93,14,0.2); }
    .success { background: rgba(104,157,106,0.12); color: #689d6a; border-color: rgba(104,157,106,0.2); }
    .warning { background: rgba(215,153,33,0.12); color: #d79921; border-color: rgba(215,153,33,0.2); }
    .error { background: rgba(204,36,29,0.12); color: #cc241d; border-color: rgba(204,36,29,0.2); }
    .info { background: rgba(69,133,134,0.12); color: #458588; border-color: rgba(69,133,134,0.2); }
    .closable { padding-right: 4px; }
    .close { background: none; border: none; cursor: pointer; font-size: 0.7rem; padding: 0 2px; border-radius: 50%; color: inherit; opacity: 0.6; display: flex; align-items: center; }
    .close:hover { opacity: 1; background: rgba(0,0,0,0.1); }
    @media (prefers-reduced-motion: no-preference) { .pill { transition: opacity 0.15s; } }
  `
  @property({ type: String }) variant: PillVariant = 'default'
  @property({ type: Boolean }) closable = false

  render(): TemplateResult {
    return html`
      <span class="pill ${this.variant} ${this.closable ? 'closable' : ''}">
        <slot></slot>
        ${this.closable ? html`<button class="close" @click="${() => this.dispatchEvent(new CustomEvent('close'))}" aria-label="Remove">✕</button>` : ''}
      </span>`
  }
}
customElements.define('ds-pill', DisplacerPill)

/* ───────── Status Bar ───────── */

export class DisplacerStatusBar extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; }
    .bar {
      display: flex; align-items: center; gap: 16px;
      padding: 4px 12px; min-height: 28px;
      background: var(--ds-bg-surface, #ebdbb2);
      border-top: 1.5px solid var(--ds-border, #bdae93);
      font-size: 0.7rem; color: var(--ds-fg-muted, #7c6f64);
      font-family: 'Inter', system-ui, sans-serif;
    }
    .section { display: flex; align-items: center; gap: 6px; }
    .spacer { flex: 1; }
    .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .dot.ok { background: #689d6a; }
    .dot.warn { background: #d79921; }
    .dot.err { background: #cc241d; }
  `
  render(): TemplateResult {
    return html`<div class="bar"><slot></slot></div>`
  }
}
customElements.define('ds-status-bar', DisplacerStatusBar)

/* ───────── Marquee ───────── */

export class DisplacerMarquee extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; overflow: hidden; }
    .track {
      display: flex; white-space: nowrap;
      animation: scroll var(--speed, 20s) linear infinite;
    }
    .track:hover { animation-play-state: paused; }
    .content { display: flex; gap: 48px; padding: 0 24px; }
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `
  @property({ type: Number }) speed = 20

  render(): TemplateResult {
    return html`
      <div class="track" style="--speed: ${this.speed}s">
        <div class="content"><slot></slot></div>
        <div class="content"><slot></slot></div>
      </div>`
  }
}
customElements.define('ds-marquee', DisplacerMarquee)

/* ───────── Scroll View ───────── */

export class DisplacerScrollView extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; height: 100%; overflow: hidden; }
    .viewport {
      width: 100%; height: 100%; overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--ds-border, #bdae93) transparent;
    }
    .viewport::-webkit-scrollbar { width: 6px; height: 6px; }
    .viewport::-webkit-scrollbar-track { background: transparent; }
    .viewport::-webkit-scrollbar-thumb { background: var(--ds-border, #bdae93); border-radius: 3px; }
    .viewport::-webkit-scrollbar-thumb:hover { background: var(--ds-primary, #b16286); }
  `
  render(): TemplateResult {
    return html`<div class="viewport"><slot></slot></div>`
  }
}
customElements.define('ds-scroll-view', DisplacerScrollView)
