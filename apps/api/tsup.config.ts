import { defineConfig } from "tsup";

// Production build of the API into a single ESM bundle.
// @rb/schema is bundled in because it ships TypeScript sources; other dependencies stay external.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  clean: true,
  noExternal: ["@rb/schema"],
});