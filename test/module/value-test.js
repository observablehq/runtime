import {Runtime} from "../../src/";
import tape from "../tape";

tape("module.value(name) returns a promise to the variable’s next value", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.variable(true).define("foo", [], () => 42);
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) implicitly makes the variable reachable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) supports errors", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => { throw new Error(42); });
  try {
    await module.value("foo");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "42");
  }
});

tape("module.value(name) supports generators", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], function*() { yield 1; yield 2; yield 3; });
  test.deepEqual(await module.value("foo"), 1);
  test.deepEqual(await module.value("foo"), 2);
  test.deepEqual(await module.value("foo"), 3);
  test.deepEqual(await module.value("foo"), 3);
});

tape("module.value(name) supports generators that throw", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], function*() { yield 1; throw new Error("fooed"); });
  module.define("bar", ["foo"], foo => foo);
  const [foo1, bar1] = await Promise.all([module.value("foo"), module.value("bar")]);
  test.deepEqual(foo1, 1);
  test.deepEqual(bar1, 1);
  try {
    await module.value("foo");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "fooed");
  }
  try {
    await module.value("bar");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "fooed");
  }
});

tape("module.value(name) supports async generators", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], async function*() { yield 1; yield 2; yield 3; });
  test.deepEqual(await module.value("foo"), 1);
  test.deepEqual(await module.value("foo"), 2);
  test.deepEqual(await module.value("foo"), 3);
  test.deepEqual(await module.value("foo"), 3);
});

tape("module.value(name) supports promises", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], async () => { return await 42; });
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) supports constants", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], 42);
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) supports missing variables", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  try {
    await module.value("bar");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "bar is not defined");
  }
});

tape("module.value(name) returns a promise on error", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const promise = module.value("bar");
  try {
    await promise;
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "bar is not defined");
  }
});

tape("module.value(name) does not force recomputation", async test => {
  let foo = 0;
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => ++foo);
  test.deepEqual(await module.value("foo"), 1);
  test.deepEqual(await module.value("foo"), 1);
  test.deepEqual(await module.value("foo"), 1);
});

tape("module.value(name) does not expose stale values", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  let resolve;
  const variable = module.define("foo", [], new Promise((y) => (resolve = y)));
  const value = module.value("foo");
  await new Promise((resolve) => setTimeout(resolve, 100));
  variable.define("foo", [], () => "fresh");
  resolve("stale");
  test.strictEqual(await value, "fresh");
});

tape("module.value(name) does not continue observing", async test => {
  const foos = [];
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], async function*() {
    try {
      foos.push(1), yield 1;
      foos.push(2), yield 2;
      foos.push(3), yield 3;
    } finally {
      foos.push(-1);
    }
  });
  test.strictEqual(await module.value("foo"), 1);
  test.deepEqual(foos, [1]);
  await runtime._compute();
  test.deepEqual(foos, [1, 2, -1]); // 2 computed prior to being unobserved
  await runtime._compute();
  test.deepEqual(foos, [1, 2, -1]); // any change would represent a leak
});
