/** @jsxRuntime automatic @jsxImportSource react */
// Renders every registered template with complete and empty data, so new templates are covered automatically.
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultTheme, emptyResume } from "@rb/schema";
import { TEMPLATES, sampleResume } from "@rb/templates";

for (const { id, component: Template } of Object.values(TEMPLATES)) {
  for (const locale of ["fa", "en"] as const) {
    test(`template ${id} (${locale}): renders sample and empty resumes`, () => {
      const theme = defaultTheme(id, locale);
      const full = renderToStaticMarkup(<Template data={sampleResume(locale)} theme={theme} />);
      assert.ok(full.includes(sampleResume(locale).basics.fullName));
      assert.ok(full.includes(`dir="${locale === "fa" ? "rtl" : "ltr"}"`));

      const empty = renderToStaticMarkup(<Template data={emptyResume(locale)} theme={theme} />);
      assert.ok(empty.length > 0);
    });
  }
}
