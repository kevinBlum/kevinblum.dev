import { defineConfig } from "vite";
import path from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  base: "/",
  publicDir: "public",
  server: {
    port: 8000,
    strictPort: true,
  },
  preview: {
    port: 8000,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        home: path.resolve(root, "index.html"),
        work: path.resolve(root, "work.html"),
        photography: path.resolve(root, "photography.html"),
        album: path.resolve(root, "album.html"),
        writing: path.resolve(root, "writing.html"),
        taylor: path.resolve(root, "taylor.html"),
        vow: path.resolve(root, "vow.html"),
        notFound: path.resolve(root, "404.html"),
        icelandLegacy: path.resolve(root, "iceland.html"),
        writingLegacy: path.resolve(root, "openletter.html"),
      },
    },
  },
});
