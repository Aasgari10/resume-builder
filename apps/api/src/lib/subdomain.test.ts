import { test } from "node:test";
import assert from "node:assert/strict";
import { subdomainFromHost, validateSubdomain } from "./subdomain";

test("subdomain: accepts and normalizes valid addresses", () => {
  for (const [input, expected] of [
    ["sara", "sara"],
    ["Sara-Mohammadi", "sara-mohammadi"],
    ["  ali99 ", "ali99"],
    ["a1b", "a1b"],
  ] as const) {
    const r = validateSubdomain(input);
    assert.ok(r.ok, input);
    assert.equal(r.value, expected);
  }
});

test("subdomain: rejects invalid addresses with a reason", () => {
  for (const [input, code] of [
    ["ab", "TOO_SHORT"],
    ["a".repeat(31), "TOO_LONG"],
    ["-sara", "INVALID_CHARS"],
    ["sara-", "INVALID_CHARS"],
    ["sa--ra", "INVALID_CHARS"],
    ["sara.m", "INVALID_CHARS"],
    ["سارا", "INVALID_CHARS"],
    ["sa ra", "INVALID_CHARS"],
    ["www", "RESERVED"],
    ["API", "RESERVED"],
  ] as const) {
    const r = validateSubdomain(input);
    assert.equal(r.ok, false, input);
    if (!r.ok) assert.equal(r.code, code, input);
  }
});

test("subdomain: extracts the site from a Host header", () => {
  assert.equal(subdomainFromHost("sara.example.ir", "example.ir"), "sara");
  assert.equal(subdomainFromHost("Sara.Example.ir:443", "example.ir"), "sara");
  assert.equal(subdomainFromHost("sara.localhost:4000", "localhost"), "sara");
  assert.equal(subdomainFromHost("example.ir", "example.ir"), null);
  assert.equal(subdomainFromHost("a.b.example.ir", "example.ir"), null);
  assert.equal(subdomainFromHost("sara.other.ir", "example.ir"), null);
  assert.equal(subdomainFromHost("sara.example.ir", undefined), null);
  assert.equal(subdomainFromHost(undefined, "example.ir"), null);
});
