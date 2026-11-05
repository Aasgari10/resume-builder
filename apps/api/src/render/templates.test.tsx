/** @jsxRuntime automatic @jsxImportSource react */
// Renders every registered template with complete and empty data, so new templates are covered automatically.
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultTheme, emptyResume } from "@rb/schema";
import { TEMPLATES, resolvePage, sampleResume } from "@rb/templates";

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

test("multi-page templates render every page and reject unknown ones", () => {
  for (const t of Object.values(TEMPLATES).filter((x) => x.pages)) {
    const data = sampleResume("fa");
    const pages = t.pages!(data);
    assert.ok(pages.includes("/about") && pages.some((p) => p.startsWith("/projects/")));
    for (const page of pages) {
      assert.equal(resolvePage(t, data, page + "/"), page);
      const html = renderToStaticMarkup(<t.component data={data} theme={defaultTheme(t.id, "fa")} page={page} link={(p) => `/s/x${p}`} />);
      assert.ok(!html.includes("پیدا نشد"), `${t.id} ${page}`);
      assert.ok(html.includes('href="/s/x/about"'), `${t.id} ${page} links`);
    }
    assert.equal(resolvePage(t, data, "/nope"), null);
    assert.equal(resolvePage(t, emptyResume("fa"), "/gallery"), null);
  }
});
