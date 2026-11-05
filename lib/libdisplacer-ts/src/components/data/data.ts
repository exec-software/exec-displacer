import './table'

import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

/* ───────── Metric ───────── */

export class DisplacerMetric extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .metric {
      display: flex; flex-direction: column; gap: 2px;
      padding: 12px 16px; border-radius: 8px;
      background: var(--ds-bg-surface, #ebdbb2);
      border: 1.5px solid var(--ds-border, #bdae93);
      min-width: 120px;
    }
    .label { font-size: 0.7rem; color: var(--ds-fg-muted, #7c6f64); text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 1.5rem; font-weight: 700; line-height: 1.2; }
    .trend { font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
    .trend.up { color: #689d6a; } .trend.down { color: #cc241d; }
  `
  @property({ type: String }) label = ''
  @property({ type: String }) value = ''
  @property({ type: String }) trend = ''
  @property({ type: String }) trendDir: 'up' | 'down' | '' = ''

  render(): TemplateResult {
    return html`
      <div class="metric">
        <span class="label">${this.label}</span>
        <span class="value">${this.value}</span>
        ${this.trend ? html`<span class="trend ${this.trendDir}">${this.trendDir === 'up' ? '↑' : '↓'} ${this.trend}</span>` : ''}
      </div>`
  }
}
customElements.define('ds-metric', DisplacerMetric)

/* ───────── Progress Bar ───────── */

export class DisplacerProgress extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; }
    .bar {
      height: 8px; border-radius: 4px;
      background: var(--ds-bg-surface-alt, #d5c4a1);
      overflow: hidden;
    }
    .fill {
      height: 100%; border-radius: 4px;
      background: var(--ds-primary, #b16286);
      transition: width 0.3s ease;
    }
    .fill.accent { background: var(--ds-accent, #d65d0e); }
    .fill.success { background: #689d6a; }
    .fill.warning { background: #d79921; }
    .fill.error { background: #cc241d; }
    .labels { display: flex; justify-content: space-between; margin-top: 4px; font-size: 0.7rem; color: var(--ds-fg-muted, #7c6f64); }
  `
  @property({ type: Number }) value = 0
  @property({ type: Number }) max = 100
  @property({ type: String }) variant: 'primary' | 'accent' | 'success' | 'warning' | 'error' = 'primary'
  @property({ type: String }) label = ''

  render(): TemplateResult {
    const pct = Math.min(100, Math.max(0, (this.value / this.max) * 100))
    return html`
      <div class="bar"><div class="fill ${this.variant}" style="width:${pct}%"></div></div>
      ${this.label ? html`<div class="labels"><span>${this.label}</span><span>${Math.round(pct)}%</span></div>` : ''}
    `
  }
}
customElements.define('ds-progress', DisplacerProgress)

/* ───────── Stat Card ───────── */

export class DisplacerStatCard extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .card {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; border-radius: 8px;
      background: var(--ds-bg-surface, #ebdbb2);
      border: 1.5px solid var(--ds-border, #bdae93);
      min-width: 180px;
    }
    .icon-box {
      width: 40px; height: 40px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; flex-shrink: 0;
    }
    .icon-box.primary { background: rgba(177,98,134,0.12); color: #b16286; }
    .icon-box.accent { background: rgba(214,93,14,0.12); color: #d65d0e; }
    .icon-box.success { background: rgba(104,157,106,0.12); color: #689d6a; }
    .info { display: flex; flex-direction: column; }
    .info .label { font-size: 0.7rem; color: var(--ds-fg-muted, #7c6f64); text-transform: uppercase; letter-spacing: 0.05em; }
    .info .value { font-size: 1.25rem; font-weight: 700; }
  `
  @property({ type: String }) label = ''
  @property({ type: String }) value = ''
  @property({ type: String }) icon = ''
  @property({ type: String }) variant: 'primary' | 'accent' | 'success' = 'primary'

  render(): TemplateResult {
    return html`
      <div class="card">
        <div class="icon-box ${this.variant}">${this.icon}</div>
        <div class="info"><span class="label">${this.label}</span><span class="value">${this.value}</span></div>
      </div>`
  }
}
customElements.define('ds-stat-card', DisplacerStatCard)
