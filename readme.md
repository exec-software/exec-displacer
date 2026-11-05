# Displacer

Displacer is a design language and UI toolkit for web and native applications.
It combines design tokens, SVG icons, Lit web components, a C software renderer
and widget toolkit, and Rust bindings for the native canvas, themes, and text.

[Design specification](spec/README.md) · [Development guide](docs/development.md) ·
[Component coverage](PORTING.md) · [Contributing](CONTRIBUTING.md) ·
[Contributors](CONTRIBUTORS.md)

## What is included

| Directory | Contents |
| --- | --- |
| [`spec/`](spec/README.md) | Color, typography, spacing, and motion tokens; component guidance; theme notes; 23 SVG icons |
| [`lib/libdisplacer-ts/`](lib/libdisplacer-ts) | TypeScript components built with Lit, theme utilities, translations, and a developer console prefab |
| [`lib/libdisplacer-native/`](lib/libdisplacer-native) | C17 retained widget tree, layout, CPU canvas renderer, and bitmap/TrueType text |
| [`lib/libdisplacer-rs/`](lib/libdisplacer-rs) | Rust ownership wrappers for the native canvas, palettes, and font faces |
| [`showcase/`](showcase) | Browser component sandbox and SDL2 native demo |

The implementations share a visual vocabulary, but component coverage and behavior
vary. See the [porting matrix](PORTING.md) for gaps. Tokens and implementations
are maintained separately; JSON changes do not automatically regenerate the libraries.
The Figma directory contains token data and a plugin manifest scaffold, not a
working plugin.

The web and native libraries also include [audio controls](spec/components/audio.md):
rotary knobs, faders, level meters, and XY pads. Applications supply audio
processing, input integration, and meter values.

## Try the web showcase

Use Node.js 22 and npm. From the repository root:

```sh
git clone https://github.com/exec-software/exec-displacer.git
cd exec-displacer
npm --prefix lib/libdisplacer-ts ci
npm --prefix lib/libdisplacer-ts run build
npm --prefix showcase/libdisplacer-ts ci
npm --prefix showcase/libdisplacer-ts run dev
```

Vite prints the local preview address. The showcase runs without a backend or
credentials. To build its static assets, run
`npm --prefix showcase/libdisplacer-ts run build`.

For a browser app using the locally built package:

```ts
import 'libdisplacer-ts'
import { applyTheme, displacerDark } from 'libdisplacer-ts'

// System fonts avoid the optional Google Fonts stylesheet in this preset.
applyTheme({ ...displacerDark, fonts: { body: 'system-ui, sans-serif' } })
document.body.innerHTML = '<ds-button variant="primary">Get started</ds-button>'
```

Build the library before adding it as a local dependency to another project:
`npm install /path/to/exec-displacer/lib/libdisplacer-ts`. This guide uses the
source checkout and does not assume a published npm package. See the
[development guide](docs/development.md) for theme and integration details.

## Build the native library

Requires CMake 3.20 or later and a C17 compiler. The library uses the C runtime,
the platform math library where needed, and bundled font code; SDL2 is only
required by the showcase.

```sh
cmake -S lib/libdisplacer-native -B lib/libdisplacer-native/build -DDISPLACER_TESTS=ON
cmake --build lib/libdisplacer-native/build
ctest --test-dir lib/libdisplacer-native/build --output-on-failure
```

With SDL2 development headers and a C++20 compiler installed, build the demo
after the library:

```sh
cmake -S showcase/libdisplacer-native -B showcase/libdisplacer-native/build
cmake --build showcase/libdisplacer-native/build
./showcase/libdisplacer-native/build/displacer-sandbox
```

The demo uses the bundled bitmap font unless you supply a trusted TrueType font
as its first argument or through `DISPLACER_FONT`. The C library renders into
memory; applications provide their own window, input, and presentation layer.

## Use the Rust bindings

Requires Rust 1.85 or later and a C17 compiler. The crate builds its native
sources from this checkout and is not configured for publication to crates.io.

```sh
cargo test --manifest-path lib/libdisplacer-rs/Cargo.toml
```

Add a path dependency to a consuming crate:

```toml
[dependencies]
displacer = { path = "../exec-displacer/lib/libdisplacer-rs" }
```

```rust
use displacer::{BuiltinTheme, Color, Displacer};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut context = Displacer::acquire()?;
    context.set_theme(BuiltinTheme::Clay);
    let mut canvas = context.create_canvas(320, 200)?;
    canvas.clear(Color::from_hex(context.current_palette().page));
    canvas.fill_rect(20.0, 20.0, 120.0, 40.0, Color::from_hex(0xf2661a));
    assert_eq!(canvas.pixels_argb8888().len(), 320 * 200);
    Ok(())
}
```

Rust bindings currently cover rendering and fonts, not the native widget API.
The native theme and compatibility font use process-global state; Rust allows
one active context and keeps native objects on one thread. Only load trusted
TrueType files or bytes: the bundled parser is not a boundary for untrusted
font input. See the [development guide](docs/development.md) for details.

## Themes

Native palettes include Clay, Light, Dark, Dark Arcana, Parchment, and Mystic.
[Clay](spec/themes/clay.md) is the default native palette and the web token
`defaultTheme`; [Mystic](spec/themes/mystic.md) offers a graphite and violet palette.
The web theme registry has its own set of presets. Set a web theme explicitly:
importing the package does not apply `defaultTheme` to the document, and individual
components have CSS fallback colors.

[Clay Light](spec/themes/clay-light.md) provides a warm-white counterpart to Clay.
It is available as web tokens (`colors['clay-light']`) and the `clayLight` theme
manifest. It does not currently have a native C or Rust built-in palette.

## Versioning

[`VERSION`](VERSION) stores the rolling repository release (`v1`, `v2`, and so on).
Each default-branch release change increments it with
`./scripts/bump-version.sh`, committed together with the change. Package, Cargo,
and CMake compatibility versions are separate from that repository version.
Rust exposes the repository value through `displacer::product_version()`.

## Contributing and license

Bug reports, documentation fixes, design feedback, and code contributions are
welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for builds and contribution
guidance, and [SECURITY.md](SECURITY.md) for vulnerability reporting.

Displacer's original code, documentation, and design assets are available under
the [MIT License](LICENSE). Bundled third-party materials retain their own
[license notices](THIRD_PARTY_NOTICES.md).

## Support the project

You can support Execute Software's work through
[Ko-fi](https://ko-fi.com/execsoftware).
Donations are optional and help fund continued development.

For enterprise licensing and support, contact
[admin@executesoftware.com](mailto:admin@executesoftware.com).
