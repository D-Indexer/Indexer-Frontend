import { defineConfig } from 'vite'
import path from 'path'

/**
 * Library build of the `<folder-verify>` Web Component: one self-contained ES module in `dist-embed/`.
 * Configure it at build time with the same VITE_* variables as the app (see docs/embed.md).
 */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'dist-embed',
    emptyOutDir: true,
    lib: { entry: path.resolve(__dirname, 'src/embed/folder-verify.ts'), formats: ['es'], fileName: () => 'folder-verify.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
