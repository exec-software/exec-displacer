import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'libdisplacer-ts': resolve(__dirname, '../../lib/libdisplacer-ts/src'),
    },
  },
  server: { port: 4000, open: true },
})
