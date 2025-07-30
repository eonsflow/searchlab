const { defineConfig } = require("vite");
const path = require("path");

module.exports = defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "./index.html"
    }
  }
});
