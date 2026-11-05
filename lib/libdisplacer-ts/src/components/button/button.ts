import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

export type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'outline' | 'danger' | 'link' | 'neu'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export class DisplacerButton extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
      border: 1.5px solid transparent;
      border-radius: 10px;
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      white-space: nowrap;
      text-decoration: none;
      line-height: 1;
      letter-spacing: -0.01em;
    }
    button:focus-visible {
      box-shadow: 0 0 0 2px var(--ds-focus-ring, #b16286);
    }
    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Sizes */
    .size-sm { height: 28px; padding: 0 12px; font-size: 0.75rem; border-radius: 6px; }
    .size-md { height: 36px; padding: 0 16px; font-size: 0.875rem; }
    .size-lg { height: 44px; padding: 0 24px; font-size: 1rem; }
    .size-xl { height: 52px; padding: 0 32px; font-size: 1.125rem; border-radius: 12px; }

    /* Variants */
    .variant-primary {
      background: var(--ds-primary, #4f46e5);
      color: #ecfeff;
      border-color: var(--ds-primary, #4f46e5);
    }
    .variant-primary:hover {
      background: var(--ds-primary-hover, #6366f1);
      border-color: var(--ds-primary-hover, #6366f1);
    }
    .variant-primary:active {
      filter: brightness(0.93);
    }

    .variant-accent {
      background: var(--ds-accent, #10a37f); color: #f8fafc; border-color: var(--ds-accent, #10a37f);
    }
    .variant-accent:hover {
      background: var(--ds-accent-hover, #0f9f75);
      border-color: var(--ds-accent-hover, #0f9f75);
    }
    .variant-accent:active {
      filter: brightness(0.93);
    }

    .variant-ghost {
      background: transparent; color: var(--ds-fg-default, #e2e8f0); border-color: transparent;
    }
    .variant-ghost:hover {
      background: transparent;
      color: var(--ds-primary, #4f46e5);
    }
    .variant-ghost:active { filter: brightness(0.94); }

    .variant-outline {
      background: transparent; color: var(--ds-fg-default, #e2e8f0); border-color: var(--ds-border, #334155);
    }
    .variant-outline:hover { border-color: var(--ds-primary, #4f46e5); color: var(--ds-primary, #4f46e5); }
    .variant-outline:active {
      filter: brightness(0.95);
    }

    .variant-danger {
      background: transparent;
      color: var(--ds-error, #ef4444);
      border-color: rgba(239, 68, 68, 0.55);
    }
    .variant-danger:hover {
      background: rgba(239, 68, 68, 0.08);
      border-color: var(--ds-error, #ef4444);
      color: var(--ds-error, #ef4444);
    }
    .variant-danger:active { filter: brightness(0.96); }

    .variant-link {
      background: transparent; color: var(--ds-primary, #4f46e5); border-color: transparent;
      padding-left: 4px; padding-right: 4px;
    }
    .variant-link:hover { text-decoration: underline; }

    .variant-neu {
      background: var(--ds-bg-surface-alt, #1f2937);
      color: var(--ds-fg-default, #3c3836);
      border-color: transparent;
      box-shadow: none;
    }
    .variant-neu:hover,
    .variant-neu:active { filter: brightness(1.05); }

    .spinner {
      width: 12px;
      aspect-ratio: 1;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `

  @property({ type: String }) variant: ButtonVariant = 'primary'
  @property({ type: String }) size: ButtonSize = 'md'
  @property({ type: Boolean }) disabled = false
  @property({ type: Boolean }) loading = false

  render(): TemplateResult {
    return html`
      <button
        class="size-${this.size} variant-${this.variant}"
        ?disabled="${this.disabled || this.loading}"
      >
        ${this.loading ? html`<span class="spinner"></span>` : html`<slot name="leading"></slot>`}
        <slot></slot>
        <slot name="trailing"></slot>
      </button>
    `
  }
}

customElements.define('ds-button', DisplacerButton)

declare global {
  interface HTMLElementTagNameMap {
    'ds-button': DisplacerButton
  }
}
