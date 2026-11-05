# Mystic

Mystic is Displacer's focused dark theme for developer tools. Neutral
near-black and graphite planes keep the workspace quiet, while color
communicates hierarchy and state.

Mystic is a general-purpose built-in theme. Native C users select
`DS_THEME_MYSTIC`; Rust users select `BuiltinTheme::Mystic`. Web consumers
can select the `mystic` token palette.

## Color roles

| Role | Value | Use |
| --- | --- | --- |
| Page | `#0e1014` | The uninterrupted application background |
| Surface | `#15181d` | Docked panes and ordinary containers |
| Alternate surface | `#1c2128` | Selected regions and grouped controls |
| Raised | `#252b34` | Floating panels and prominent controls |
| Text | `#e6e9ef` | Primary labels and content |
| Muted text | `#aab1bd` | Secondary labels and supporting content |
| Subtle text | `#8992a1` | Metadata and low-emphasis content |
| Border | `#697485` | Meaningful interactive or structural edges |
| Muted border | `#343c48` | Quiet separators |
| Primary | `#ac74ff` | Focus, current selection, and primary actions |
| Accent | `#7e9fbd` | Secondary actions and sparse highlights |

Violet is the signature, but is reserved for focus, current selection, and
primary actions. Ordinary borders and text remain cool neutral. The steel-blue
accent supports secondary actions without competing with focus. Semantic
status colors are deliberately desaturated and retain their usual meaning.

Elevation uses neutral black shadow. Do not tint drop shadows violet. A subtle
violet focus halo is permitted when it is needed for keyboard visibility, but
it should remain a crisp state indicator rather than ambient glow.

## Contrast contract

The default, muted, and subtle text colors meet WCAG AA contrast on the dark
surface tiers. Default text exceeds 7:1 against the page. Primary, accent, and
semantic colors exceed 4.5:1 when used as foreground detail on the raised
surface, while the default border reaches 3:1 against that surface for
meaningful UI boundaries.

Components that use primary, accent, or semantic colors as a solid fill should
use the dark raised color (`#252b34`) for their label. Muted borders are
decorative; do not rely on them as the only indication of state or control
boundaries.
