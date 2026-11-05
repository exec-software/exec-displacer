import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type SelectSize = 'sm' | 'md' | 'lg'
export type SelectStatus = 'default' | 'error' | 'success'
export interface SelectOption {
  value: string
  label: string
}

export class DisplacerSelect extends LitElement {
  static styles = css`
    :host { display: inline-block; width: 100%; }
    .wrapper { display: flex; flex-direction: column; gap: 4px; }
    label {
      font-size: 0.8rem; font-weight: 500;
      color: var(--ds-fg-default, #3c3836);
    }
    .select-row { position: relative; display: flex; align-items: center; }
    select {
      width: 100%;
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--ds-bg-surface, #ebdbb2);
      color: var(--ds-fg-default, #3c3836);
      border: 1.5px solid var(--ds-border, #bdae93);
      border-radius: 6px;
      outline: none;
      transition: all 0.15s ease;
      appearance: none;
      cursor: pointer;
    }
    select:focus { border-color: var(--ds-focus-ring, #b16286); box-shadow: 0 0 0 2px rgba(177,98,134,0.15); }
    select:disabled { opacity: 0.5; cursor: not-allowed; }
    .chevron {
      position: absolute; right: 10px;
      color: var(--ds-fg-muted, #7c6f64);
      pointer-events: none; font-size: 0.7rem;
    }
    .status-error select { border-color: #cc241d; }
    .status-error select:focus { box-shadow: 0 0 0 2px rgba(204,36,29,0.15); }
    .status-success select { border-color: #689d6a; }
    .hint { font-size: 0.75rem; color: var(--ds-fg-muted, #7c6f64); }
    .hint-error { color: #cc241d; }

    .size-sm select { height: 28px; padding: 0 28px 0 10px; font-size: 0.75rem; }
    .size-md select { height: 36px; padding: 0 32px 0 12px; font-size: 0.875rem; }
    .size-lg select { height: 44px; padding: 0 36px 0 16px; font-size: 1rem; }
  `

  @property({ type: String }) size: SelectSize = 'md'
  @property({ type: String }) status: SelectStatus = 'default'
  @property({ type: String }) label = ''
  @property({ type: String }) hint = ''
  @property({ type: String }) value = ''
  @property({ type: String }) placeholder = ''
  @property({ type: Array }) options: SelectOption[] = []
  @property({ type: Boolean }) disabled = false

  private _onChange(e: Event) {
    this.value = (e.target as HTMLSelectElement).value
    this.dispatchEvent(new CustomEvent('ds-change', { detail: { value: this.value } }))
  }

  render(): TemplateResult {
    return html`
      <div class="wrapper status-${this.status} size-${this.size}">
        ${this.label ? html`<label>${this.label}</label>` : ''}
        <div class="select-row">
          <select ?disabled="${this.disabled}" @change="${this._onChange}">
            ${this.placeholder
              ? html`<option value="" ?selected="${this.value === ''}" disabled>${this.placeholder}</option>`
              : ''}
            ${this.options.map(
              (opt) => html`
                <option value="${opt.value}" ?selected="${opt.value === this.value}">
                  ${opt.label}
                </option>`
            )}
          </select>
          <span class="chevron">▼</span>
        </div>
        ${this.hint ? html`<span class="hint ${this.status === 'error' ? 'hint-error' : ''}">${this.hint}</span>` : ''}
      </div>
    `
  }
}

customElements.define('ds-select', DisplacerSelect)
