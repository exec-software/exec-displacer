# Layout — Displacer Component Spec

> *Version v1 · Hi-DPI first, scale down to mobile*

---

## Principles

| Principle | Implementation |
|-----------|---------------|
| **Ultrawide reference** | 5144×2160 design canvas at 2× scale factor |
| **Fluid scaling** | Clamp-based sizing — `clamp(min, preferred, max)` |
| **Consistent grid** | 4px base unit, 8-column grid at mobile → 16 at ultrawide |
| **Content max-width** | 1440px for reading, full-bleed for dashboards |

---

## Container

| Variant | Max Width | Padding (side) | Use Case |
|---------|-----------|----------------|----------|
| **xs** | 480px | 16px | Narrow forms, dialogs |
| **sm** | 640px | 16px | Settings, single column |
| **md** | 768px | 24px | Article, content page |
| **lg** | 1024px | 24px | Dashboard panel |
| **xl** | 1280px | 32px | Main app layout |
| **fluid** | 100% | 24–48px | Full-bleed dashboard |
| **ultrawide** | 100% | 48px | 5K+ reference layout |

## Grid

Default: 12-column grid. Column count increases with viewport width.

| Breakpoint | Min Width | Columns | Gutter | Margin |
|------------|-----------|---------|--------|--------|
| **mobile** | 0 | 4 | 8px | 12px |
| **tablet** | 640px | 8 | 12px | 20px |
| **desktop** | 1024px | 12 | 16px | 24px |
| **wide** | 1440px | 12 | 20px | 32px |
| **ultrawide** | 1920px | 16 | 24px | 48px |

## Stack

| Prop | Values | Default |
|------|--------|---------|
| **direction** | `row` / `column` | `column` |
| **gap** | `xs`(4px) / `sm`(8px) / `md`(16px) / `lg`(24px) / `xl`(48px) | `md` |
| **align** | `start` / `center` / `end` / `stretch` | `start` |
| **wrap** | `true` / `false` | `false` |
