import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'libdisplacer-ts': resolve(__dirname, '../../lib/libdisplacer-ts/src'),
    },
  },
  build: { rollupOptions: { input: { main: resolve(__dirname, 'index.html'), execute: resolve(__dirname, 'execute.html') } } },
  server: { port: 4000, open: true },
})
