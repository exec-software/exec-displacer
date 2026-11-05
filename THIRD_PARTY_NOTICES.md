# Third-party notices

Displacer's [MIT License](LICENSE) applies to its original code, documentation,
and design assets. The following bundled materials retain their own terms.

## stb_truetype

[`lib/libdisplacer-native/src/core/stb_truetype.h`](lib/libdisplacer-native/src/core/stb_truetype.h)
includes Sean Barrett's `stb_truetype` implementation. The header contains its
copyright and complete alternative MIT/public-domain license texts. Retain
those notices when redistributing the bundled header or its code.
The native CMake install includes the original header and Displacer's MIT
license under `share/licenses/displacer/`; component-based packages must include
the `displacer-licenses` install component.

## DejaVu font test fixtures

The base64-encoded font subsets under
[`lib/libdisplacer-rs/tests/fixtures/`](lib/libdisplacer-rs/tests/fixtures)
are DejaVu font fixtures. Their applicable copyright, trademark, permission,
and modification terms are preserved in
[`LICENSE-DejaVu.txt`](lib/libdisplacer-rs/tests/fixtures/LICENSE-DejaVu.txt).
Keep that notice with redistributed font fixtures.

## Lit in the web bundle

The Vite web bundle includes Lit, lit-html, lit-element, and
`@lit/reactive-element` under the BSD 3-Clause License. The complete applicable
notice is included in the web package's
[`THIRD_PARTY_NOTICES.md`](lib/libdisplacer-ts/THIRD_PARTY_NOTICES.md), alongside
its package-local Displacer license, so those notices travel with npm archives.

## Package dependencies and optional fonts

Lit and the npm/Cargo build and development dependencies are obtained through
their package managers and retain their respective licenses. Review the actual
dependency licenses when distributing an application or bundled build.

Some web theme presets reference Google Fonts stylesheets. These font files are
not bundled in this repository. Obtain the relevant font licenses before
self-hosting or redistributing them, or select system fonts as shown in the
[development guide](docs/development.md).
