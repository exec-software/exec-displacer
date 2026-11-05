# Table & DataGrid — Displacer Component Spec

> *Version v1 · High-density data, Hi-DPI, responsive*

---

## Variants

| Variant | Use Case | Features |
|---------|----------|----------|
| **table** | Standard data rows | Sortable columns, striped rows, hover |
| **compact** | Dense data display | Smaller padding, monospace numbers |
| **grid** | Spreadsheet-like | Cell borders, editable look |
| **dashboard** | KPI rows | Larger cells, sparklines, badges |

---

## Anatomy (Table)

```
┌──────────────────────────────────────────────┐
│  Header 1  ▲ │  Header 2  │  Header 3  ▼ │  ← Sortable headers with sort indicator
├──────────────────────────────────────────────┤
│  Cell 1a      │  Cell 2a    │  Cell 3a      │  ← Hover row highlight
│  Cell 1b      │  Cell 2b    │  Cell 3b      │  ← Striped (even row alt bg)
│  Cell 1c      │  Cell 2c    │  Cell 3c      │
├──────────────────────────────────────────────┤
│  Showing 3 of 24 results          [1] [2] …  │  ← Pagination footer
└──────────────────────────────────────────────┘
```

## Row States

| State | Background | Text |
|-------|-----------|------|
| **default** | `bg.surface` | `fg.default` |
| **hover** | `primary at 4%` | `fg.default` |
| **selected** | `primary at 8%` | `primary` |
| **striped** | `bg.surface-alt at 30%` | `fg.default` |
| **disabled** | `bg.surface-alt at 20%` | `fg.muted` |

## Cell Types

| Type | Alignment | Format |
|------|-----------|--------|
| **text** | Left | Plain |
| **numeric** | Right | Monospace, tabular figures |
| **badge** | Center | `<ds-badge>` |
| **progress** | Left | `<ds-progress>` inline |
| **action** | Center | Icon buttons |
| **avatar** | Left | Avatar + name |

## Responsive

| Breakpoint | Behavior |
|-----------|----------|
| > 1024px | Full table with all columns |
| 640–1024px | Horizontal scroll within container |
| < 640px | Card view — each row becomes a stacked card |
