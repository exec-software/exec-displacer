# Button — Displacer Component Spec

> *Version v1 · Design token reference: `spec/tokens/`*

---

## States

| State | Description |
|-------|-------------|
| **default** | Resting state, interactive |
| **hover** | Mouse over — accent colour shift |
| **active/pressed** | Mouse down — deeper shade |
| **focus** | Keyboard focus — ring glow |
| **disabled** | Non-interactive, reduced opacity |
| **loading** | Spinner replacing icon slot |

## Variants

| Variant | Use Case |
|---------|----------|
| **primary** | Primary call-to-action — `primary.default` |
| **accent** | Secondary action — `accent.default` |
| **ghost** | Low-emphasis, no background |
| **outline** | Medium emphasis, bordered |
| **danger** | Destructive action — `semantic.error` |
| **link** | Text-only, underlined on hover |

## Sizes

| Size | Height | Padding X | Font Size | Icon Size |
|------|--------|-----------|-----------|-----------|
| **sm** | 28px | 12px | 0.75rem | 14px |
| **md** | 36px | 16px | 0.875rem | 16px |
| **lg** | 44px | 24px | 1rem | 18px |
| **xl** | 52px | 32px | 1.125rem | 20px |

## Anatomy

```
┌──────────────────────────────┐
│  [icon]  Label Text  [icon]  │
└──────────────────────────────┘
```

- Leading icon (optional)
- Label text (required for non-icon buttons)
- Trailing icon (optional, used for dropdowns)
- Corner radius: `6px` (sm), `8px` (md/lg), `12px` (xl)

## Dark Mode

- Same colours but with elevated luminance on hover/active
- Glow effects use `glow-primary` / `glow-accent` tokens
- Ghost variant: `fg.muted` default, `fg.default` on hover

## Accessibility targets

- Minimum touch target: 44×44px (WCAG 2.5.5)
- Focus ring: `2px solid border.focus` with `2px` offset
- Disabled buttons: `opacity: 0.4`, no pointer events
- Loading state: button remains at same width (prevent layout shift)

## Figma

- Component variants: Type (primary/accent/ghost/outline/danger/link) × Size (sm/md/lg/xl) × State (default/hover/active/focus/disabled/loading)
- Auto-layout with horizontal + vertical centering
- Icon slot: boolean toggle for leading/trailing
- Corner radius linked to size token
