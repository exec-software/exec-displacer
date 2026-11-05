import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type TextareaSize = 'sm' | 'md' | 'lg'
export type TextareaStatus = 'default' | 'error' | 'success'

export class DisplacerTextarea extends LitElement {
  static styles = css`
    :host { display: inline-block; width: 100%; }
    .wrapper { display: flex; flex-direction: column; gap: 4px; }
    label {
      font-size: 0.8rem; font-weight: 500;
      color: var(--ds-fg-default, #3c3836);
    }
    textarea {
      width: 100%; box-sizing: border-box;
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--ds-bg-surface, #ebdbb2);
      color: var(--ds-fg-default, #3c3836);
      border: 1.5px solid var(--ds-border, #bdae93);
      border-radius: 6px;
      outline: none;
      transition: all 0.15s ease;
      resize: vertical;
      line-height: 1.5;
    }
    textarea:focus { border-color: var(--ds-focus-ring, #b16286); box-shadow: 0 0 0 2px rgba(177,98,134,0.15); }
    textarea::placeholder { color: var(--ds-fg-muted, #7c6f64); opacity: 0.7; }
    .no-resize textarea { resize: none; }
    .status-error textarea { border-color: #cc241d; }
    .status-error textarea:focus { box-shadow: 0 0 0 2px rgba(204,36,29,0.15); }
    .status-success textarea { border-color: #689d6a; }
    .hint { font-size: 0.75rem; color: var(--ds-fg-muted, #7c6f64); }
    .hint-error { color: #cc241d; }

    .size-sm textarea { padding: 6px 10px; font-size: 0.75rem; }
    .size-md textarea { padding: 8px 12px; font-size: 0.875rem; }
    .size-lg textarea { padding: 12px 16px; font-size: 1rem; }
  `

  @property({ type: String }) size: TextareaSize = 'md'
  @property({ type: String }) status: TextareaStatus = 'default'
  @property({ type: String }) label = ''
  @property({ type: String }) placeholder = ''
  @property({ type: String }) hint = ''
  @property({ type: String }) value = ''
  @property({ type: Number }) rows = 4
  @property({ type: Boolean }) disabled = false
  @property({ type: Boolean }) noResize = false

  private _onInput(e: Event) {
    this.value = (e.target as HTMLTextAreaElement).value
    this.dispatchEvent(new CustomEvent('ds-input', { detail: { value: this.value } }))
  }

  private _onChange() {
    this.dispatchEvent(new CustomEvent('ds-change', { detail: { value: this.value } }))
  }

  render(): TemplateResult {
    return html`
      <div class="wrapper status-${this.status} size-${this.size} ${this.noResize ? 'no-resize' : ''}">
        ${this.label ? html`<label>${this.label}</label>` : ''}
        <textarea
          .value="${this.value}"
          rows="${this.rows}"
          placeholder="${this.placeholder}"
          ?disabled="${this.disabled}"
          @input="${this._onInput}"
          @change="${this._onChange}"
        ></textarea>
        ${this.hint ? html`<span class="hint ${this.status === 'error' ? 'hint-error' : ''}">${this.hint}</span>` : ''}
      </div>
    `
  }
}

customElements.define('ds-textarea', DisplacerTextarea)
