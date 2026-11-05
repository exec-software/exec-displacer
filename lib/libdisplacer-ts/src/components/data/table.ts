import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

export class DisplacerTable extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; overflow-x: auto;
      scrollbar-width: thin; scrollbar-color: var(--ds-border, #bdae93) transparent; }
    :host::-webkit-scrollbar { width: 10px; height: 8px; }
    :host::-webkit-scrollbar-track { background: transparent; }
    :host::-webkit-scrollbar-thumb { background: var(--ds-border, #bdae93); border-radius: 5px; }
    :host::-webkit-scrollbar-thumb:hover { background: var(--ds-primary, #b16286); }
    table {
      width: 100%; border-collapse: collapse;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.8rem;
    }
    th {
      text-align: left; padding: 10px 12px;
      font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--ds-fg-muted, #7c6f64);
      border-bottom: 1.5px solid var(--ds-border, #bdae93);
      cursor: pointer; user-select: none; white-space: nowrap;
      background: var(--ds-bg-surface, #ebdbb2);
      position: sticky; top: 0;
    }
    th:hover { color: var(--ds-primary, #b16286); }
    th .sort { margin-left: 4px; opacity: 0.3; }
    th .sort.active { opacity: 1; color: var(--ds-primary, #b16286); }
    td {
      padding: 8px 12px; border-bottom: 1px solid var(--ds-border-muted, #d5c4a1);
      color: var(--ds-fg-default, #3c3836);
    }
    tbody tr { cursor: pointer; }
    tr:hover td { background: rgba(177,98,134,0.04); }
    tr.selected td { background: rgba(177,98,134,0.08); }
    .compact td { padding: 4px 8px; font-size: 0.75rem; }
    .numeric { text-align: right; font-family: 'JetBrains Mono', monospace; }
    .empty { text-align: center; padding: 32px; color: var(--ds-fg-muted, #7c6f64); font-size: 0.875rem; }

    /* Card view for mobile */
    @media (max-width: 639px) {
      table, thead, tbody, th, td, tr { display: block; }
      thead { display: none; }
      tr {
        background: var(--ds-bg-surface, #ebdbb2);
        border: 1.5px solid var(--ds-border, #bdae93);
        border-radius: 8px; padding: 12px; margin-bottom: 8px;
      }
      td {
        padding: 4px 0; border: none;
        display: flex; justify-content: space-between;
      }
      td::before { content: attr(data-label); font-weight: 600; color: var(--ds-fg-muted); font-size: 0.7rem; }
    }
  `

  @property({ type: Array }) columns: { key: string; label: string; numeric?: boolean }[] = []
  @property({ type: Array }) rows: Record<string, any>[] = []
  @property({ type: String }) variant: 'default' | 'compact' = 'default'
  @property({ type: String }) emptyMessage = 'No data'
  @property({ type: Number }) selectedIndex = -1
  @property({ type: Array }) selectedIndexes: number[] = []

  @state() private sortCol = ''
  @state() private sortDir: 'asc' | 'desc' = 'asc'

  private _sort(col: string) {
    if (this.sortCol === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc' }
    else { this.sortCol = col; this.sortDir = 'asc' }
    this.dispatchEvent(new CustomEvent('sort', { detail: { col, dir: this.sortDir } }))
  }

  render(): TemplateResult {
    if (!this.rows.length) return html`<div class="empty">${this.emptyMessage}</div>`
    return html`
      <table class="${this.variant}">
        <thead>
          <tr>
            ${this.columns.map((col) => html`
              <th @click="${() => this._sort(col.key)}">
                ${col.label}
                <span class="sort ${this.sortCol === col.key ? 'active' : ''}">
                  ${this.sortCol === col.key ? (this.sortDir === 'asc' ? '▲' : '▼') : '▽'}
                </span>
              </th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.rows.map((row, i) => html`
            <tr class="${i === this.selectedIndex || this.selectedIndexes.includes(i) ? 'selected' : ''}"
                @click="${(e: MouseEvent) => this.dispatchEvent(new CustomEvent('row-click', { detail: { row, index: i, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey } }))}">
              ${this.columns.map((col) => html`
                <td class="${col.numeric ? 'numeric' : ''}" data-label="${col.label}">
                  ${row[col.key] ?? '—'}
                </td>`)}
            </tr>`)}
        </tbody>
      </table>`
  }
}
customElements.define('ds-table', DisplacerTable)
