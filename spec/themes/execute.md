# Execute

Execute is Displacer's corporate theme: near-black surfaces, off-white content,
and a bright lime signal color. It follows the engineering language of
[executesoftware.com](https://executesoftware.com), verified on November 13,
2026. Space Grotesk headings, small monospaced labels, crisp rules, and a
restrained structural grid establish its identity.

The theme adapts that reference for application controls and dense workspaces.
It adds a raised surface, lifts low-emphasis text and meaningful borders,
and supplies semantic colors that remain readable on every surface tier.
The website's countdown, marketing layout, and animations are not part of the
theme. Clay remains Displacer's default.

Web consumers use the `execute` theme manifest, registry ID `execute`, and
`colors.execute` palette. Native C users select `DS_THEME_EXECUTE`; Rust users
select `BuiltinTheme::Execute`. The [development guide](../../docs/development.md#execute-theme)
shows registration and selection examples. The [Figma export](../figma/tokens-for-figma.json)
contains an independent `execute` token set.

## Color roles

| Role | Value | Use |
| --- | --- | --- |
| Page | `#07090B` | The application canvas |
| Surface | `#0D1115` | Docked panes, headers, and ordinary containers |
| Alternate surface | `#141A1F` | Grouped controls and selected regions |
| Raised | `#171E24` | Floating panels and menus; added for application UI |
| Text | `#EDF2F5` | Primary content and labels |
| Muted text | `#7B8790` | Supporting content and secondary labels |
| Subtle text | `#667581` | Non-essential metadata and low-emphasis decoration |
| Inverse text | `#07090B` | Labels on primary, accent, and semantic fills |
| Border | `#667581` | Meaningful control boundaries and structural edges |
| Muted border | `#202830` | Decorative rules and the background grid |
| Focus | `#B8FF3D` | Visible keyboard focus |
| Primary | `#B8FF3D` | Primary action, current selection, and active signal |
| Primary hover | `#CBFF73` | Hovered primary controls |
| Primary active | `#DAFF9C` | Pressed primary controls |
| Primary muted | `rgba(184, 255, 61, 0.14)` | Low-emphasis primary selection fill |
| Accent | `#EDF2F5` | Neutral secondary emphasis |
| Accent hover | `#FFFFFF` | Hovered secondary emphasis |
| Accent active | `#D8E2E8` | Pressed secondary emphasis |
| Accent muted | `rgba(237, 242, 245, 0.08)` | Low-emphasis neutral fill |

Lime carries interaction and focus. Keep ordinary content off-white and
structural surfaces neutral. The accent is deliberately neutral so it does not
compete with the primary signal. The source site's `#39434B` dim text is not
used for required application text: this theme lifts the subtle tier to
`#667581`. Its original `#202830` rule remains a decorative separator, while
meaningful boundaries use the stronger default border.

| Semantic role | Value |
| --- | --- |
| Information | `#8AC9E8` |
| Success | `#8DDB9A` |
| Warning | `#FFB547` |
| Error | `#FF7D87` |

Semantic status retains its meaning. Warning preserves the corporate amber;
information, success, and error provide readable companions for application
feedback. Use labels or icons with status color so the distinction does not
depend on hue alone.

Jewel roles retain Displacer's cross-theme slot names. In Execute they map to
lime (`amethyst`), blue (`sapphire`), green (`emerald`), coral (`ruby`), amber
(`topaz`), soft lime (`citrine`, `#6E9A29`), and muted gray (`quartz`). Soft lime
is a decorative supporting color, not a substitute for required text or the
primary focus indicator.

## Typography and structure

- Use **Space Grotesk**, weights 400 and 500, for display, heading, and body
  roles. Keep headings compact with modest negative tracking.
- Use **IBM Plex Mono**, weights 400 and 500, for controls, technical labels,
  and metadata. Uppercase labels use restrained tracking; retain normal case
  for prose and user content.
- Preferred fallback stacks are `"Space Grotesk", Arial, sans-serif` and
  `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.
- Use square panels and 1px structural rules. Pill buttons and status badges
  are the rounded exceptions.
- The reference website uses a 12-column grid with 16px gaps, 48px gutters,
  and a 1440px maximum width. Adapt its alignment and rhythm to application
  density and viewport width rather than forcing those marketing dimensions
  onto every pane.
- Keep a technical background grid subtle and static. It is decoration and
  must not obstruct reading or stand in for a control boundary.

Fonts are not bundled by naming them in a token. Applications choose whether
to use the preset's optional Google Fonts import, supply local files with their
licenses, or use system fallbacks. Native palettes select colors; applications
supply the corresponding text roles and layout.

## Contrast contract

The following ratios use opaque sRGB token colors against the four background
tiers, with the raised tier giving the lowest contrast:

- Default text reaches at least **14.9:1** and muted text at least **4.58:1**.
  Use these tiers for ordinary readable content.
- Primary and accent exceed **13.9:1**. Semantic foreground colors reach at
  least **6.84:1** on every tier.
- Inverse text reaches at least **8.1:1** on primary, accent, and semantic fills.
- Default borders reach at least **3.55:1**, supporting meaningful control
  boundaries. Muted borders are decorative and need another cue for state.
- Subtle text reaches **3.55:1** on raised surfaces. It does not meet the
  normal-size text AA threshold; reserve it for non-essential metadata,
  disabled content, or appropriately large text. Required labels and small
  readable metadata use the muted or default tier.

Muted translucent fills are not standalone focus indicators. Preserve a crisp
lime outline for keyboard focus. Avoid ambient neon glow and colored drop
shadows; use neutral elevation where separation is needed. These token ratios
do not replace checking the actual component, font size, opacity, and state in
the consuming application.
