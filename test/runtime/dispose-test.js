import {Runtime} from "@observablehq/runtime";
import assert from "assert";
import {sleep} from "../variable/valueof.js";

describe("runtime.dispose", () => {
  it("invalidates all variables", async () => {
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    main.variable(true).define(["invalidation"], async (invalidation) => {
      await invalidation;
      log.push("invalidation");
    });
    await sleep();
    runtime.dispose();
    await sleep();
    assert.deepStrictEqual(log, ["invalidation"]);
  });
  it("terminates generators", async () => {
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    main.variable(true).define([], function* () {
      try {
        while (true) yield;
      } finally {
        log.push("return");
      }
    });
    await sleep();
    runtime.dispose();
    await sleep();
    assert.deepStrictEqual(log, ["return"]);
  });
});
