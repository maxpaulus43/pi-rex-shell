import assert from "node:assert/strict";
import { test } from "node:test";
import extension, { exitCode, tail } from "./index.ts";

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

test("local floating jobs target the Pi pane's tab, not the active tab", async (t) => {
  for (const [key, value] of Object.entries({ REX_BLOCK: "block:parent" })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }

  let execute;
  extension({
    on() {},
    registerTool: (tool) => { execute = tool.execute; },
    async exec(_bin, args) {
      if (args[0] === "block") {
        assert.deepEqual(args, ["block", "inspect", "block:parent", "--json"]);
        return { code: 0, stdout: JSON.stringify({ session_id: "session:test" }) };
      }
      const [, , , session, method, json] = args;
      assert.equal(session, "session:test");
      const body = JSON.parse(json);
      if (method === "session.describe_block") {
        assert.equal(body.block_id, "block:parent");
        return { code: 0, stdout: JSON.stringify({ block: { window_id: "window:A" } }) };
      }
      assert.equal(method, "session.new_layer");
      assert.equal(body.window_id, "window:A");
      assert.equal(body.focus, false);
      // Stop before the extension starts a real Rex watcher.
      return { code: 1, stderr: "test stopped at layer creation" };
    },
  });
  await assert.rejects(execute("", { action: "start", command: "true" }, undefined, undefined, {}), /test stopped at layer creation/);
});
