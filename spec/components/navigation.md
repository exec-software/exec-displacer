# Navigation — Displacer Component Spec

> *Version v1*

---

## Variants

| Variant | Orientation | Use Case |
|---------|-------------|----------|
| **sidebar** | Vertical | App shell navigation |
| **topbar** | Horizontal | Top-level page navigation |
| **tabs** | Horizontal | Section switching within a page |
| **breadcrumb** | Horizontal | Hierarchical location display |
| **pagination** | Horizontal | Page-through content sets |
| **stepper** | Horizontal | Multi-step workflow progress |

## Anatomy (Sidebar)

```
┌─────────────────────────┐
│  Logo / Brand           │  ← Header (branding + collapse)
├─────────────────────────┤
│  ▶︎ Dashboard           │  ← Nav item (active state highlighted)
│    Vault                │
│    Projects             │
│  ───────────────────    │  ← Section divider
│  ▶︎ Settings            │
│    Admin                │
├─────────────────────────┤
│  🟢 Service connected   │  ← Footer (status)
└─────────────────────────┘
```

| Part | Description |
|------|-------------|
| **Nav item** | Icon + label + optional badge |
| **Active item** | Theme primary highlight |
| **Section** | Grouped items with optional label |
| **Collapse** | Toggle between icon-only (w-14) and full (w-56) |
| **Footer** | Status indicator, user avatar |

## Item States

| State | Background | Text | Icon |
|-------|-----------|------|------|
| **default** | transparent | `fg.default` | `fg.muted` |
| **hover** | `primary.muted` | `primary.default` | `primary.default` |
| **active** | `primary.muted` | `primary.default` | `primary.default` |
| **disabled** | transparent | `fg.subtle` | `fg.subtle` |

## Spacing

| Size | Item Height | Padding X | Icon Size | Font Size |
|------|-----------|-----------|-----------|-----------|
| **sm** | 32px | 8px | 16px | 0.75rem |
| **md** | 40px | 12px | 18px | 0.875rem |
| **lg** | 48px | 16px | 20px | 1rem |

## Dark Mode

- Sidebar background: `bg.surface` (`#282828`)
- Active item: `primary.muted` with the theme's primary highlight
- Same state transitions as light mode
