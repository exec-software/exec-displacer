# Card — Displacer Component Spec

> *Version v1*

---

## Variants

| Variant | Background | Border | Shadow | Use Case |
|---------|-----------|--------|--------|----------|
| **surface** | `bg.surface` | `border.default` | `sm` | Default container |
| **raised** | `bg.raised` | `border.muted` | `md` | Elevated content |
| **outline** | Transparent | `border.default` | none | Inline groupings |
| **glass** | `bg.surface` + blur(8px) | `border.muted` | `lg` | Overlaid content |
| **interactive** | `bg.surface` | `border.default` → `border.focus` on hover | `sm` → `md` on hover | Clickable cards |

## Anatomy

```
┌──────────────────────────────────┐
│  [Optional header / media]       │
│  ─────────────────────────────   │ (separator, optional)
│  Body content                    │
│  Padding: 16px (side), 16px (top)│
│  ─────────────────────────────   │ (separator, optional)
│  [Optional footer / actions]     │
└──────────────────────────────────┘
```

## Sizes

| Size | Min Width | Padding | Corner Radius |
|------|-----------|---------|--------------|
| **sm** | 200px | 12px | 6px |
| **md** | 280px | 16px | 8px |
| **lg** | 360px | 24px | 12px |
| **xl** | 480px | 32px | 16px |

## Dark Mode

- Glass cards use `bg rgba(40,40,40,0.85)` with `backdrop-filter: blur(12px)`
- Surface cards shift from `#282828` to `#32302f` on hover
- Border defaults to `border.default` (`#504945`)

## Accessibility targets

- Interactive cards have `role="button"`, `tabindex="0"`, keyboard handler
- Focus visible ring on interactive variant
- aria-label on card if it's actionable
