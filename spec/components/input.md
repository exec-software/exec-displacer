# Input — Displacer Component Spec

> *Version v1*

---

## Variants

| Variant | Use Case |
|---------|----------|
| **text** | Single-line text entry |
| **textarea** | Multi-line text entry |
| **search** | Search with magnifier icon |
| **password** | Password with show/hide toggle |
| **number** | Numeric input with stepper |
| **select** | Dropdown selector |
| **file** | File picker with drag-and-drop zone |
| **date** | Date picker |

## Anatomy

```
  Label (optional)
  ┌──────────────────────────────────┐
  │ [icon]  Placeholder text     [×] │
  └──────────────────────────────────┘
  Hint text (optional)
  Error message (conditional)
```

## Sizes

| Size | Height | Padding X | Font Size | Corner Radius |
|------|--------|-----------|-----------|--------------|
| **sm** | 28px | 8px | 0.75rem | 4px |
| **md** | 36px | 12px | 0.875rem | 6px |
| **lg** | 44px | 16px | 1rem | 8px |
| **xl** | 52px | 20px | 1.125rem | 10px |

## States

| State | Border | Background | Text |
|-------|--------|-----------|------|
| **default** | `border.default` | `bg.surface` | `fg.default` |
| **hover** | `border.focus` | same | same |
| **focus** | `border.focus` + `ring` | same | same |
| **filled** | `border.default` | same | `fg.default` |
| **error** | `semantic.error` | `semantic.error` at 4% | same |
| **disabled** | `border.muted` | `bg.surface-alt` at 50% | `fg.muted` |
| **readonly** | `border.muted` | `bg.surface-alt` at 30% | `fg.default` |

## Textarea

- Min height: 3 lines (computed from font-size × line-height)
- Resize: vertical only (or none for fixed)
- Character count shown when `maxLength` set

## Dark Mode

- Same states with dark background values
- Focus ring uses `border.focus` with glow
- Disabled state: `opacity: 0.5`

## Accessibility targets

- All inputs have associated `<label>` via `htmlFor`
- `aria-describedby` for hint/error text
- `aria-invalid="true"` on error state
- Error message linked via `aria-live="polite"`
