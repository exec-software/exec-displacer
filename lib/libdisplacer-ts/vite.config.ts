import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    // `tsc` emits the package's per-module JS and declaration files first. Keep those files:
    // package.json exports `dist/index.js` and subpaths such as `dist/tokens/index.js`, while
    // Vite additionally produces the convenient single-file browser bundle.
    emptyOutDir: false,
    lib: {
      // Match package.json's public export map. The tokens entry stays DOM-free, so servers and
      // build tooling can consume design values without evaluating the web components.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'tokens/index': resolve(__dirname, 'src/tokens/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
      },
      name: 'Displacer',
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [],
    },
  },
})
