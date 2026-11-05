import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export class DisplacerContainer extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; }
    .container {
      width: 100%; margin: 0 auto;
      padding-left: var(--ds-padding, 24px);
      padding-right: var(--ds-padding, 24px);
    }
    .xs { max-width: 480px; } .sm { max-width: 640px; } .md { max-width: 768px; }
    .lg { max-width: 1024px; } .xl { max-width: 1280px; }
    .fluid, .ultrawide { max-width: 100%; }
    @media (min-width: 1920px) { .ultrawide { padding-left: 48px; padding-right: 48px; } }
  `
  @property({ type: String }) size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fluid' | 'ultrawide' = 'xl'

  render(): TemplateResult {
    return html`<div class="container ${this.size}"><slot></slot></div>`
  }
}
customElements.define('ds-container', DisplacerContainer)

export class DisplacerStack extends LitElement {
  static styles = css`
    :host { display: flex; }
    .stack {
      display: flex; width: 100%;
      --gap: 16px;
    }
    .row { flex-direction: row; } .column { flex-direction: column; }
    .gap-xs { --gap: 4px; gap: 4px; } .gap-sm { --gap: 8px; gap: 8px; }
    .gap-md { --gap: 16px; gap: 16px; } .gap-lg { --gap: 24px; gap: 24px; }
    .gap-xl { --gap: 48px; gap: 48px; }
    .align-start { align-items: flex-start; } .align-center { align-items: center; }
    .align-end { align-items: flex-end; } .align-stretch { align-items: stretch; }
    .wrap { flex-wrap: wrap; }
  `
  @property({ type: String }) direction: 'row' | 'column' = 'column'
  @property({ type: String }) gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'
  @property({ type: String }) align: 'start' | 'center' | 'end' | 'stretch' = 'start'
  @property({ type: Boolean }) wrap = false

  render(): TemplateResult {
    return html`
      <div class="stack ${this.direction} gap-${this.gap} align-${this.align} ${this.wrap ? 'wrap' : ''}">
        <slot></slot>
      </div>`
  }
}
customElements.define('ds-stack', DisplacerStack)

export class DisplacerGrid extends LitElement {
  static styles = css`
    :host { display: grid; width: 100%; }
    .grid {
      display: grid; width: 100%;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    @media (min-width: 640px) { .grid { grid-template-columns: repeat(8, 1fr); gap: 12px; } }
    @media (min-width: 1024px) { .grid { grid-template-columns: repeat(12, 1fr); gap: 16px; } }
    @media (min-width: 1920px) { .grid { grid-template-columns: repeat(16, 1fr); gap: 24px; } }
    .cols-2 { grid-template-columns: repeat(2, 1fr); }
    .cols-3 { grid-template-columns: repeat(3, 1fr); }
    .cols-4 { grid-template-columns: repeat(4, 1fr); }
  `
  @property({ type: Number }) cols = 0

  render(): TemplateResult {
    return html`<div class="grid ${this.cols ? 'cols-' + this.cols : ''}"><slot></slot></div>`
  }
}
customElements.define('ds-grid', DisplacerGrid)
