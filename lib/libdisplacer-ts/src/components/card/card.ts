import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type CardVariant = 'surface' | 'raised' | 'outline' | 'glass' | 'interactive'

export class DisplacerCard extends LitElement {
  static styles = css`
    :host { display: block; }
    .card {
      border-radius: 8px;
      padding: 16px;
      border: 1.5px solid var(--ds-border, #bdae93);
      transition: all 0.15s ease;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .card-surface { background: var(--ds-bg-surface, #ebdbb2); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card-raised { background: var(--ds-bg-surface-alt, #f9f5d7); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .card-outline { background: transparent; box-shadow: none; }
    .card-glass { background: rgba(235,219,178,0.7); backdrop-filter: blur(8px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .card-interactive {
      background: var(--ds-bg-surface, #ebdbb2);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      cursor: pointer;
    }
    .card-interactive:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: var(--ds-primary, #b16286);
    }
    .card-header { font-weight: 600; margin-bottom: 8px; }
    .card-body { font-size: 0.8rem; color: var(--ds-fg-muted, #7c6f64); }
    .card-footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ds-border, #bdae93); }
  `

  @property({ type: String }) variant: CardVariant = 'surface'

  render(): TemplateResult {
    return html`
      <div class="card card-${this.variant}">
        <slot name="header"><div class="card-header"><slot name="title">Card</slot></div></slot>
        <div class="card-body"><slot></slot></div>
        <slot name="footer"><div class="card-footer"><slot name="actions"></slot></div></slot>
      </div>
    `
  }
}

customElements.define('ds-card', DisplacerCard)
