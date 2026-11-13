import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultTheme, type ResumeData } from "@rb/schema";
import { createHash } from "node:crypto";
import { getTemplate, sampleResume } from "@rb/templates";
import { SITE_CSP, escapeHtml, jsonForScript, renderSitePage } from "./sitePage";

const theme = defaultTheme("minimal-portfolio", "fa");

function render(data: ResumeData, seo = {}) {
  return renderSitePage({ data, theme, seo, url: "https://sara.example.ir" });
}

test("page: renders a complete RTL document with generated SEO tags", () => {
  const html = render(sampleResume("fa"));
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<html lang="fa" dir="rtl">/);
  assert.match(html, /<title>سارا محمدی، توسعه‌دهنده‌ی فرانت‌اند<\/title>/);
  assert.match(html, /<meta name="description" content="توسعه‌دهنده‌ی فرانت‌اند با ۵ سال/);
  assert.match(html, /<link rel="canonical" href="https:\/\/sara\.example\.ir">/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /"sameAs":\["https:\/\/github\.com\/example"/);
  assert.ok(!html.includes('name="robots"'));
  assert.ok(html.includes("سوابق کاری"), "template body is rendered");
});

test("page: user overrides and noindex take effect", () => {
  const html = render(sampleResume("fa"), { title: "عنوان دلخواه", description: "توضیح دلخواه", noindex: true });
  assert.match(html, /<title>عنوان دلخواه<\/title>/);
  assert.match(html, /<meta name="description" content="توضیح دلخواه">/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
});

test("page: user content cannot inject markup or break out of the JSON-LD script", () => {
  const data = sampleResume("en");
  data.basics.fullName = `</script><script>alert(1)</script>`;
  data.basics.summary = `"><img src=x onerror=alert(1)>`;
  const html = render(data);

  assert.equal((html.match(/<script/g) ?? []).length, 1, "only the JSON-LD script tag exists");
  assert.ok(!html.includes("<img src=x"), "summary is escaped");
  assert.ok(!html.includes("onerror=alert(1)>"), "no raw attribute injection");
});

test("escaping helpers", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  const json = jsonForScript({ s: "</script><!--\u2028" });
  assert.ok(!json.includes("<") && !json.includes(">"));
  assert.deepEqual(JSON.parse(json), { s: "</script><!--\u2028" });
});

test("page: inner pages of a multi-page site get their own title and canonical link", () => {
  const html = renderSitePage({
    data: sampleResume("fa"),
    theme: defaultTheme("vitrine-portfolio", "fa"),
    seo: {},
    url: "https://sara.example.ir",
    page: "/about",
    link: (p) => p,
  });
  assert.ok(html.includes("<title>درباره‌ی من | "));
  assert.ok(html.includes('rel="canonical" href="https://sara.example.ir/about"'));
});

test("placeholder links lead to the top of the published page", () => {
  const data = sampleResume("fa");
  const html = renderSitePage({ data, theme: defaultTheme("vitrine-portfolio", "fa"), seo: {}, page: "/about" });
  assert.ok(!/href="https?:\/\/[^"]*example\.(com|ir)/.test(html));
  assert.ok(html.includes('href="#"'));
});

test("page: a template's own script runs only by its hash; user content adds none", () => {
  const tanin = getTemplate("tanin-site");
  const data = tanin.sample!("fa");
  data.basics.fullName = `</script><script>alert(1)</script>`;
  const html = renderSitePage({ data, theme: defaultTheme("tanin-site", "fa"), seo: {}, url: "https://studio.example.ir", page: "/" });
  const scripts = [...html.matchAll(/<script(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
  assert.equal(scripts.length, 1, "only the template's script");
  const hash = `'sha256-${createHash("sha256").update(scripts[0]!).digest("base64")}'`;
  assert.ok(SITE_CSP.includes(hash), "its hash is in the page's policy");
  assert.ok(!html.includes("alert(1)</script>"), "user content cannot close or add a script");
  assert.match(SITE_CSP, /media-src 'self' https:/);
});
