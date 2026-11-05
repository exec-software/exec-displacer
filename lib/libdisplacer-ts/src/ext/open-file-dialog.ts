import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

export interface FileEntry {
  name: string
  path: string
  size: number
  isDir: boolean
  modified: string
}

export class DisplacerOpenFileDialog extends LitElement {
  static styles = css`
    :host { display: contents; }
    .backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
    }
    .dialog {
      background: var(--ds-bg-raised, #f9f5d7);
      border: 1.5px solid var(--ds-border, #bdae93);
      border-radius: 12px; width: 640px; max-height: 80vh;
      display: flex; flex-direction: column;
      box-shadow: 0 16px 48px rgba(0,0,0,0.15);
    }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1.5px solid var(--ds-border, #bdae93); }
    .title { font-weight: 600; font-size: 1rem; }
    .close-btn { width: 28px; height: 28px; border: none; background: none; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--ds-fg-muted, #7c6f64); font-size: 1rem; }
    .close-btn:hover { background: rgba(177,98,134,0.1); color: var(--ds-primary, #b16286); }

    .path-bar { display: flex; align-items: center; gap: 8px; padding: 8px 20px; border-bottom: 1px solid var(--ds-border-muted, #d5c4a1); font-size: 0.8rem; }
    .path-bar .path { flex: 1; background: var(--ds-bg-surface, #ebdbb2); border: 1.5px solid var(--ds-border, #bdae93); border-radius: 6px; padding: 4px 10px; font-family: inherit; font-size: 0.8rem; color: var(--ds-fg-default, #3c3836); }
    .nav-btn { background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; color: var(--ds-fg-muted, #7c6f64); font-size: 0.8rem; }
    .nav-btn:hover { background: rgba(177,98,134,0.08); color: var(--ds-primary, #b16286); }

    .file-list { flex: 1; overflow-y: auto; padding: 4px; }
    .file-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: background 0.1s; }
    .file-row:hover { background: rgba(177,98,134,0.06); }
    .file-row.selected { background: rgba(177,98,134,0.1); color: var(--ds-primary, #b16286); }
    .file-row .icon { width: 18px; text-align: center; flex-shrink: 0; }
    .file-row .name { flex: 1; }
    .file-row .size { width: 80px; text-align: right; color: var(--ds-fg-muted, #7c6f64); font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; }

    .footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1.5px solid var(--ds-border, #bdae93); }
    .footer .filename { flex: 1; background: var(--ds-bg-surface, #ebdbb2); border: 1.5px solid var(--ds-border, #bdae93); border-radius: 6px; padding: 4px 10px; font-size: 0.8rem; font-family: inherit; color: var(--ds-fg-default, #3c3836); }

  `

  @property({ type: String }) path = '.'
  @property({ type: Array }) files: FileEntry[] = []
  @property({ type: Boolean }) open = false
  @property({ type: String }) title = 'Open File'
  @state() private selectedPath = ''

  render(): TemplateResult {
    if (!this.open) return html``
    return html`
      <div class="backdrop" @click="${(e: Event) => { if ((e.target as HTMLElement).classList.contains('backdrop')) this.dispatchEvent(new CustomEvent('close')) }}">
        <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
          <div class="header">
            <span class="title">${this.title}</span>
            <button class="close-btn" @click="${() => this.dispatchEvent(new CustomEvent('close'))}">✕</button>
          </div>
          <div class="path-bar">
            <button class="nav-btn" @click="${() => this.dispatchEvent(new CustomEvent('navigate', {detail: {dir: '..'}}))}">↑</button>
            <input class="path" .value="${this.path}" @change="${(e: Event) => this.dispatchEvent(new CustomEvent('navigate', {detail: {dir: (e.target as HTMLInputElement).value}}))}" />
            <button class="nav-btn" @click="${() => this.dispatchEvent(new CustomEvent('refresh'))}">⟳</button>
          </div>
          <div class="file-list">
            ${this.files.length === 0 ? html`<div style="text-align:center;padding:32px;color:var(--ds-fg-muted);font-size:0.8rem;">No files</div>` : ''}
            ${this.files.map((f) => html`
              <div class="file-row ${this.selectedPath === f.path ? 'selected' : ''}"
                   @click="${() => { this.selectedPath = f.path; if (!f.isDir) this.dispatchEvent(new CustomEvent('select', {detail: f})) }}"
                   @dblclick="${() => { if (f.isDir) this.dispatchEvent(new CustomEvent('navigate', {detail: {dir: f.name}})) }}"
                   role="button" tabindex="0">
                <span class="icon">${f.isDir ? '📁' : '📄'}</span>
                <span class="name">${f.name}</span>
                <span class="size">${f.isDir ? '—' : formatSize(f.size)}</span>
              </div>`)}
          </div>
          <div class="footer">
            <input class="filename" .value="${this.selectedPath.split('/').pop() || ''}" placeholder="filename.ext" />
            <button class="close-btn" style="padding:4px 12px;border-radius:6px;background:var(--ds-primary,#b16286);color:#fff;font-size:0.8rem;width:auto;" @click="${() => this.dispatchEvent(new CustomEvent('open', {detail: {path: this.selectedPath}}))}">Open</button>
          </div>
        </div>
      </div>`
  }
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

customElements.define('ds-open-file-dialog', DisplacerOpenFileDialog)
