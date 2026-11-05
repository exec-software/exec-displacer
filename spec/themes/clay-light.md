# Clay Light

Clay Light is [Clay](clay.md)'s daylight counterpart. It keeps flat planes,
restrained borders, orange and teal accents, and an emphasis on iconography.
Warm-white surfaces establish groups and elevation, with pure white reserved
for floating surfaces. Darker orange and teal tones carry text and icons on
these light backgrounds.

For an application with a dark/light switch, pair `clay` with `clay-light` to
preserve the same visual family. The separate `light` palette uses parchment
surfaces and amethyst accents.

Web consumers use `colors['clay-light']`, or the `clayLight` theme manifest for
registry-driven products. Clay remains Displacer's default; Clay Light is an
explicit opt-in. It currently has no native C or Rust built-in palette.

## Color roles

| Role | Value | Use |
| --- | --- | --- |
| Page | `#f6f5f2` | The uninterrupted application background |
| Surface | `#fdfcf9` | Docked panes, headers, and composers |
| Alternate surface | `#e9e7e2` | Selected rows, inputs, and chips |
| Raised | `#ffffff` | Floating panels and menus |
| Text | `#292723` | Primary labels and content |
| Muted text | `#615c55` | Secondary labels and supporting content |
| Subtle text | `#6b645b` | Placeholders, hints, and timestamps |
| Border | `#d2cec6` | Hairline edges between regions |
| Muted border | `#e5e1da` | Quiet separators inside a region |
| Primary | `#9d4211` | Focus, current selection, and primary actions |
| Accent | `#1e6a60` | Assistant activity and secondary highlights |
| Inverse text | `#f0eee9` | Labels on primary, accent, or semantic fills |

Structure comes from surface fills rather than outlines. Borders are decorative
hairlines darker than the surfaces they divide. Reserve orange for interaction
and state; use teal for secondary emphasis. Semantic status colors retain their
usual meaning.

Because the page is near-white, Clay's tier ordering inverts for one role:
`fg.inverse` is a warm off-white here, not a near-black, since it sits on dark
brand and semantic fills.

## Contrast contract

Measured across all four background tiers:

- Default text reaches at least 12:1 and muted text at least 5.3:1 on every
  surface tier.
- Primary and accent clear WCAG AA (4.5:1) as foreground on every tier, at
  5.1:1 or better, and their hover and active tones only increase it.
- Semantic colors clear 4.5:1 as foreground on *every* tier, at 4.6:1 or
  better. This is stronger than Clay's contract, which restricts them to the
  page and surface tiers; Clay Light needs no fill-plus-inverse-text fallback.
- Inverse text reaches at least 4.9:1 on primary, accent, and semantic fills.
- Subtle text reaches at least 4.7:1, so unlike Clay's subtle tone it is not
  limited to non-essential text. Keep using it for placeholders, hints, and
  timestamps anyway, to preserve the shared hierarchy between the two themes.
- Borders are decorative hairlines (under 1.6:1). Never rely on a border alone
  to show a control boundary or state; use the fill ramp and the primary focus
  color.

## Pairing with Clay

A product switching between the two themes should swap the whole token set, not
individual roles, and should expect the brand hues to shift tone across the
switch: Clay's `#f2661a` primary becomes `#9d4211`, and its `#33b7a6` accent
becomes `#1e6a60`. Both directions preserve the role each color plays, which is
what keeps a switch from looking like a different application.

Products that let a user pick their own accent should re-derive a readable tone
per theme from the user's chosen hue rather than storing one literal color for
both, since a hue tuned for charcoal will rarely clear AA on white.
