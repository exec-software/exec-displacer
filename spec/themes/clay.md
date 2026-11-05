# Clay

Clay is Displacer's default theme. It takes its cues from digital sculpting
and 3D authoring tools:
flat charcoal planes, almost no borders, and two signature colors. The orange
primary carries focus, current selection, primary actions, and emphasized
text and icons. The teal accent marks assistant activity and sparse secondary
highlights. Clay favors iconography over decoration.

Native C users get `DS_THEME_CLAY` as the initial `ds_current_theme`; Rust
users get `BuiltinTheme::Clay` from `BuiltinTheme::default()`; web consumers
use `colors.clay`, which `defaultTheme` names.

For a product that offers a daylight mode, pair Clay with
[Clay Light](clay-light.md), which keeps this theme's structure and hues and
adjusts them for warm-white surfaces. Clay Light is currently available in the
web library; it has no built-in native C or Rust palette.

## Color roles

| Role | Value | Use |
| --- | --- | --- |
| Page | `#141414` | The uninterrupted application background |
| Surface | `#1a1a1a` | Docked panes, headers, and composers |
| Alternate surface | `#222222` | Selected rows, inputs, and chips |
| Raised | `#262626` | Floating panels and menus |
| Text | `#ece9e5` | Primary labels and content |
| Muted text | `#9c9893` | Secondary labels and supporting content |
| Subtle text | `#6e6a65` | Placeholders, hints, and timestamps |
| Border | `#2a2a2a` | Hairline edges between regions |
| Muted border | `#212121` | Quiet separators inside a region |
| Primary | `#f2661a` | Focus, current selection, and primary actions |
| Accent | `#33b7a6` | Assistant activity and secondary highlights |
| Inverse text | `#0f0f0f` | Labels on primary, accent, or semantic fills |

Structure comes from the fill ramp, with each tier a few levels brighter than
the last, rather than from outlines. Borders are hairlines one step brighter
than the surfaces they divide. Orange is reserved for interaction and state;
do not use it as decoration, and do not let teal compete with it for focus.
Semantic status colors keep their usual meaning and must not be replaced by
either brand color.

## Contrast contract

- Default text reaches at least 12:1 and muted text at least 5:1 on every
  surface tier.
- Primary and accent meet WCAG AA (4.5:1) as foreground on every tier.
- Semantic colors meet 4.5:1 as foreground on the page and surface tiers. On
  the alternate and raised tiers, use them as fills with inverse text instead.
- Inverse text reaches at least 5:1 on primary, accent, and semantic fills.
- Subtle text reaches 3.2:1 to 3.4:1 on the page and surface tiers. Use it
  only for non-essential text such as placeholders, hints, and timestamps,
  never for content a reader needs.
- Borders are decorative hairlines (under 1.3:1). Never rely on a border alone
  to show a control boundary or state; use the fill ramp and the primary
  focus color.
