import { defineConfig } from 'vite'
import { resolve } from 'path'

/** One self-hostable ES module: no CDN imports or runtime dependency paths. */
export default defineConfig({
  plugins: [{
    name: 'editor-runtime-notices',
    generateBundle(_options, bundle) {
      const packages = new Set<string>()
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        for (const module of Object.keys(chunk.modules)) {
          const found = /\/node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(module)
          if (found) packages.add(found[1])
        }
      }
      this.emitFile({ type: 'asset', fileName: 'displacer-editors.packages.json', source: JSON.stringify([...packages].sort()) })
    },
  }],
  build: {
    emptyOutDir: false,
    lib: { entry: resolve(__dirname, 'src/editors/index.ts'), formats: ['es'], fileName: () => 'displacer-editors.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
