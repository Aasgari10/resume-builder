// Every website template's example content must be valid site data: otherwise a site started from
// the example could not be saved or published.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resumeDataSchema } from "@rb/schema";
import { PORTFOLIO_TEMPLATES } from "@rb/templates";

for (const t of PORTFOLIO_TEMPLATES) {
  if (!t.sample) continue;
  test(`sample content of ${t.id} is valid`, () => {
    const r = resumeDataSchema.safeParse(t.sample!("fa"));
    assert.ok(r.success, r.success ? "" : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
  });
}
