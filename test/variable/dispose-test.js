import { Runtime } from "@observablehq/runtime";
import assert from "assert";
import { delay, sleep } from "./valueof.js";

describe("variable.dispose", () => {
  it("prevents a subsequent delete from notifying the observer", async () => {
    // https://github.com/observablehq/notebook-kit/issues/174
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    const foo = main
      .variable({ fulfilled: (value) => log.push(`a-${value}`) })
      .define([], () => 1);
    await sleep();
    foo.dispose();
    foo.delete();
    main
      .variable({ fulfilled: (value) => log.push(`b-${value}`) })
      .define([], () => 2);
    await sleep();
    assert.deepStrictEqual(log, ["a-1", "b-2"]); // not followed by "a-undefined"
  });
  it("prevents future computation", async () => {
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    const foo = main
      .variable({ fulfilled: (value) => log.push(value) })
      .define([], () => 1);
    await sleep();
    foo.dispose();
    foo.define([], () => 2);
    await sleep();
    assert.deepStrictEqual(log, [1]);
  });
  it("cancels an in-flight computation", async () => {
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    const foo = main
      .variable({ fulfilled: (value) => log.push(value) })
      .define([], () => delay(1, 100));
    await sleep();
    foo.dispose();
    await sleep(200);
    assert.deepStrictEqual(log, []);
  });
  it("invalidates the variable", async () => {
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    const foo = main
      .variable(true)
      .define(["invalidation"], async (invalidation) => {
        await invalidation;
        log.push("invalidation");
      });
    await sleep();
    foo.dispose();
    await sleep();
    assert.deepStrictEqual(log, ["invalidation"]);
  });
  it("terminates generators", async () => {
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    const foo = main.variable(true).define([], function* () {
      try {
        while (true) yield;
      } finally {
        log.push("return");
      }
    });
    await sleep();
    foo.dispose();
    await sleep();
    assert.deepStrictEqual(log, ["return"]);
  });
  it("terminates async generators", async () => {
    const runtime = new Runtime();
    const main = runtime.module();
    const log = [];
    let when = "before";
    const foo = main.variable(true).define([], async function* () {
      try {
        while (true) {
          await sleep(20);
          yield log.push(when);
        }
      } finally {
        log.push("return");
      }
    });
    await sleep(50); // 50ms gives time to log two values
    foo.dispose();
    when = "after";
    await sleep(50); // logs one last value and then terminates
    assert.deepStrictEqual(log, ["before", "before", "after", "return"]);
  });
});
