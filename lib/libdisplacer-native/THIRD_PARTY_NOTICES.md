# Native Displacer notices

Displacer's original code is licensed under the MIT License. A CMake install
places that text in `LICENSE.txt` beside this notice.

The native font renderer includes Sean Barrett's `stb_truetype` implementation.
The adjacent, unmodified `stb_truetype.h` preserves its upstream copyright and
complete alternative MIT/public-domain license texts. Keep those notices when
redistributing the native library or bundled parser code.

The default CMake install includes these files under
`share/licenses/displacer/`. Packaging tools that select individual install
components must also include the `displacer-licenses` component.
