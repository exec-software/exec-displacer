# Figma assets

[tokens-for-figma.json](tokens-for-figma.json) is a static export of the original
light and dark palettes, typography, spacing, radii, and shadows. It uses a
`global` token set with `value` and `type` fields. Adapt or import this data with
a token tool that supports that format.

The export does not include every palette or value in the current
[source tokens](../tokens/). In particular, Clay, Clay Light, and Mystic are defined in
[colors.json](../tokens/colors.json) and need to be added if your design file
uses those themes. Font tokens name typefaces; they do not install fonts.

The [plugin manifest](plugin/manifest.json) is a scaffold. Its referenced
`code.js` and `ui.html` are not included, so this repository does not provide a
runnable Figma plugin. Use the JSON export directly or supply a plugin
implementation before loading the manifest in Figma.
