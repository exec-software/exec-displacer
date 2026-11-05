# Developing with Displacer

This guide assumes commands run from the repository root. Start with the
[README](../readme.md) for dependencies and build commands, and the
[specification index](../spec/README.md) for design assets.

## Web components

The root `libdisplacer-ts` import registers the component and prefab custom
elements. Use it in a browser; the root entry accesses DOM APIs and is not an
SSR entry point. The `libdisplacer-ts/tokens` entry provides design values
without registering elements. The `libdisplacer-ts/components` entry registers
components without the prefab import.

The library build cleans `dist/`, runs TypeScript checking and Vite bundling,
then writes JavaScript and declarations. Build it before installing or rebuilding
the showcase's local file dependency. Neither Storybook configuration nor a
web unit-test suite is currently included, despite the package's script entries.

Component attributes, properties, and events vary; the source is the reference
for the currently implemented API. The [component specifications](../spec/components)
include design targets that may be ahead of the implementation. Accessibility
and keyboard behavior should be checked in the consuming application.

## Applying a web theme

```ts
import { displacerDark, themeRegistry } from 'libdisplacer-ts'

themeRegistry.register({
  ...displacerDark,
  fonts: { body: 'system-ui, sans-serif', mono: 'monospace' },
})
themeRegistry.apply('displacer-dark')
```

`applyTheme` sets document-root CSS custom properties, a `data-ds-theme`
attribute, and the `ds-active-theme` local-storage value. It does not automatically
restore that saved choice at startup. Presets can include remote Google Fonts
stylesheets in `fonts.imports`; applying an unmodified preset with those entries
loads them. Omit `imports` and supply system or self-hosted font families to
avoid that request. The registry starts empty; register presets before using
`themeRegistry.apply(id)`.

The Observatory preset is exported as `observatory`, with the registry ID
`observatory`. It combines parchment surfaces with blue research accents.

## Optional developer console integration

`ds-dev-console` is a UI prefab, not a backend server. It defaults to the
same-origin `/api` base for its console and agent integrations. Those actions
require an application-provided implementation; the showcase needs none of them.
Configure the `apiBase` JavaScript property or the lowercase `apibase` attribute.
System health polling is disabled until the `monitorUrl` property (or lowercase
`monitorurl` attribute) is set. For example:

```html
<ds-dev-console apibase="/api" monitorurl="/monitor"></ds-dev-console>
```

The console then reads `<monitorUrl>/health` while its system
view is active. Server-side authorization and command validation belong in the
application hosting these optional endpoints.

## Native C integration

Public headers are under `lib/libdisplacer-native/include/displacer/`.
The library has no windowing backend. Use `ds_canvas_pixels`,
`ds_canvas_width`, and `ds_canvas_height` to present the software canvas using
the application's chosen platform layer.

```c
#include <displacer/vis.h>

int main(void) {
    ds_canvas *canvas = ds_canvas_create(320, 200);
    if (!canvas) return 1;
    ds_canvas_clear(canvas, ds_colorf_hex(0x141414));
    ds_canvas_fill_rect(canvas, 20, 20, 120, 40, ds_colorf_hex(0xf2661a));
    ds_canvas_destroy(canvas);
    return 0;
}
```

After building, CMake can install headers and the library to a chosen prefix:

```sh
cmake --install lib/libdisplacer-native/build --prefix ./build/install
```

The default install also places Displacer's MIT license and the bundled font
parser's complete upstream notices under `share/licenses/displacer/`. If a
package selects individual CMake install components, include
`displacer-licenses` alongside the library and headers.

The native showcase expects the library in `lib/libdisplacer-native/build`.
Its optional font argument and `DISPLACER_FONT` environment variable accept a
font chosen by the user. Without either, bitmap text remains available.

## Rust integration and font ownership

The Rust build compiles the native canvas, core theme, and font sources using
the `cc` build dependency; keep the sibling native library and root `VERSION`
file when using the crate as a path or Git dependency. It does not wrap the
widget tree or provide an event loop.

`Displacer::acquire()` claims the single process-wide theme/default-font owner.
`Canvas` and `FontFace` values remain on one thread. Owned font faces support
multiple sizes and text roles without replacing the compatibility font.
`pixels_argb8888()` exposes packed `0xAARRGGBB` values; native byte order depends
on the host, so choose the correct pixel format in the presentation layer.

Both file-based and byte-based TrueType loaders require trusted, valid fonts.
Rust marks those operations `unsafe` because `stb_truetype` does not validate
all table offsets. The native loaders retain their own font-data copy. The
bundled bitmap font needs no external font file.

## Validation

Run the builds from the README for the affected implementation. The native
CTest suite compares optimized drawing against a reference renderer. Rust tests
cover canvas behavior, themes, fonts, and ownership constraints. A web build
checks types and bundling; use the showcase in a browser to inspect visual,
keyboard, and focus behavior. A successful build does not establish full
cross-platform or cross-implementation parity.
