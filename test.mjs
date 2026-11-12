import assert from "node:assert/strict";
import { test } from "node:test";
import { exitCode, tail } from "./index.ts";

test("exitCode reads rex wait --json", () => {
  assert.equal(exitCode('{"exit_code":7,"error":"exit status 7"}\n'), 7);
  assert.equal(exitCode('{"exit_code":0}'), 0);
  assert.equal(exitCode(""), undefined);
  assert.equal(exitCode("not json"), undefined);
});

test("tail cleans and keeps the end", () => {
  assert.equal(tail("\x1b[31mred\x1b[0m\x07\n\n"), "red");
  const t = tail("a".repeat(10) + "END", 5);
  assert.ok(t.endsWith("aaEND") && t.startsWith("[Earlier output cut"));
});
