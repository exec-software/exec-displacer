# Dialog — Displacer Component Spec

> *Version v1*

---

## Variants

| Variant | Use Case |
|---------|----------|
| **modal** | Blocks interaction with rest of page |
| **non-modal** | Floating, allows page interaction |
| **drawer** | Slides in from side (left/right/bottom) |
| **tooltip** | Small contextual popover |
| **popover** | Medium contextual menu |

## Anatomy (Modal)

```
┌──────────────────────────────────┐  ← Backdrop (60% black, blur)
│                                  │
│  ┌──────────────────────────────┐│  ← Dialog surface
│  │  Title          [close ×]   ││  ← Header
│  │  ─────────────────────────  ││  ← Separator
│  │                             ││
│  │  Body / content area        ││  ← Content (scrollable)
│  │                             ││
│  │  ─────────────────────────  ││  ← Separator
│  │  [Cancel]      [Confirm]   ││  ← Footer / actions
│  └──────────────────────────────┘│
│                                  │
└──────────────────────────────────┘
```

## Sizes

| Size | Width | Max Height | Corner Radius |
|------|-------|-----------|--------------|
| **sm** | 360px | 60vh | 8px |
| **md** | 480px | 70vh | 12px |
| **lg** | 640px | 80vh | 16px |
| **xl** | 800px | 85vh | 20px |
| **fullscreen** | 100vw | 100vh | 0 |

## Motion

- Entrance: `motion.scale.entrance` (scale 0.95 → 1 + fade in)
- Exit: `motion.scale.exit` (scale 1 → 0.95 + fade out)
- Backdrop: fade in over `motion.duration.normal`
- Drawer: slides over `motion.duration.slow`

## Dark Mode

- Backdrop: `rgba(0,0,0,0.6)` with blur
- Surface: `bg.raised` (`#32302f`)
- Same sizing and spacing as light mode

## Accessibility targets

- Focus trap inside dialog when open
- `aria-modal="true"`, `role="dialog"`
- Escape key closes
- First focusable element receives focus on open
- Restores focus to trigger element on close
