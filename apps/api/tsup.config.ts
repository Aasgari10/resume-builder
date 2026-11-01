import { defineConfig } from "tsup";

// Production build of the API into a single ESM bundle.
// Workspace packages ship TypeScript sources, so they are bundled in; other dependencies stay external.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  clean: true,
  noExternal: ["@rb/schema", "@rb/templates"],
});
