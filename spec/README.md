# Displacer design reference

Displacer combines shared design tokens, component specifications, SVG icons,
and implementations for web and native applications. This directory describes
the visual language and its intended interaction patterns.

## Start here

| Reference | Contents |
| --- | --- |
| [Color tokens](tokens/colors.json) | Light, dark, Mystic, Clay, and Clay Light palettes |
| [Typography tokens](tokens/typography.json) | Font stacks, weights, and type scale |
| [Spacing, motion, and shadows](tokens/spacing-motion-shadows.json) | Layout units, timing, curves, and elevation |
| [Clay](themes/clay.md) | Default charcoal, orange, and teal theme |
| [Clay Light](themes/clay-light.md) | Warm-white counterpart to Clay; currently web only |
| [Mystic](themes/mystic.md) | Graphite surfaces with violet focus |
| [Iconography](iconography/README.md) | Available SVG assets and style rules |
| [Figma assets](figma/README.md) | Token export and integration status |

## Component specifications

- [Button](components/button.md)
- [Input](components/input.md)
- [Card](components/card.md)
- [Dialog](components/dialog.md)
- [Navigation](components/navigation.md)
- [Layout](components/layout.md)
- [Table and data grid](components/table.md)
- [AI chat and agent presence](components/ai-chat.md)
- [Audio controls](components/audio.md)

These specifications describe design targets. The libraries implement different
subsets of the components and behavior; a listed variant or accessibility target
does not establish that it is implemented on every platform. Check the
[web components](../lib/libdisplacer-ts/src/components/),
[native headers](../lib/libdisplacer-native/include/displacer/), and
[Rust wrapper](../lib/libdisplacer-rs/src/lib.rs) for the current APIs. Test
keyboard navigation, labeling, contrast, and reduced motion in your application.

## Using the tokens

Color names describe roles: `bg` for surfaces, `fg` for text, `border` for
edges and focus, `primary` for the main action, `accent` for secondary emphasis,
and `semantic` for status. Read values from the selected palette. Clay is the
default; some component diagrams and hexadecimal examples show the original
light and dark palettes.

Token files are checked-in data. They do not automatically generate every
library's styles, and component defaults can differ. Some layout breakpoints in
the component specifications describe the web grid's behavior rather than the
generic spacing token names. Review the relevant implementation when changing a
token or adopting it on another platform.

The font stacks name preferred typefaces and system fallbacks; naming a font
does not bundle its files. Applications choose how to supply fonts and must
retain the licenses for any fonts they distribute.
