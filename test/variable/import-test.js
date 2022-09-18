import {Runtime} from "../../src/";
import tape from "../tape";
import valueof, {promiseInspector, sleep} from "./valueof";

tape("variable.import(name, module) imports a variable from another module", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  main.import("foo", module);
  const bar = main.variable(true).define("bar", ["foo"], foo => `bar-${foo}`);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, alias, module) imports a variable from another module under an alias", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  main.import("foo", "baz", module);
  const bar = main.variable(true).define("bar", ["baz"], baz => `bar-${baz}`);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, module) does not compute the imported variable unless referenced", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const foo = module.define("foo", [], () => test.fail());
  main.import("foo", module);
  await runtime._computing;
  test.equal(foo._reachable, false);
});

tape("variable.import(name, module) can import a variable that depends on a mutable from another module", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("mutable foo", [], () => 13);
  module.define("bar", ["mutable foo"], (foo) => foo);
  main.import("bar", module);
  const baz = main.variable(true).define("baz", ["bar"], bar => `baz-${bar}`);
  test.deepEqual(await valueof(baz), {value: "baz-13"});
});

tape("variable.import() allows non-circular imported values from circular imports", async test => {
  const runtime = new Runtime();
  const a = runtime.module();
  const b = runtime.module();
  a.define("foo", [], () => "foo");
  b.define("bar", [], () => "bar");
  a.import("bar", b);
  b.import("foo", a);
  const afoobar = a.variable(true).define("foobar", ["foo", "bar"], (foo, bar) => 'a' + foo + bar);
  const bfoobar = b.variable(true).define("foobar", ["foo", "bar"], (foo, bar) => 'b' + foo + bar);
  test.deepEqual(await valueof(afoobar), {value: "afoobar"});
  test.deepEqual(await valueof(bfoobar), {value: "bfoobar"});
});

tape("variable.import() fails when importing creates a circular reference", async test => {
  const runtime = new Runtime();
  const a = runtime.module();
  const b = runtime.module();
  a.import("bar", b);
  a.define("foo", ["bar"], (bar) => `foo${bar}`);
  b.import("foo", a);
  b.define("bar", ["foo"], (foo) => `${foo}bar`);
  const afoobar = a.variable(true).define("foobar", ["foo", "bar"], (foo, bar) => 'a' + foo + bar);
  const bbarfoo = b.variable(true).define("barfoo", ["bar", "foo"], (bar, foo) => 'b' + bar + foo);
  test.deepEqual(await valueof(afoobar), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(bbarfoo), {error: "RuntimeError: circular definition"});
});

tape(
  "variable.import() allows direct circular import-with if the resulting variables are not circular",
  async test => {
    const runtime = new Runtime();
    let a1, b1, a2, b2;

    // Module 1
    // a = 1
    // b
    // import {b} with {a} from "2"
    function define1() {
      const main = runtime.module();
      a1 = main.variable(true).define("a", () => 1);
      b1 = main.variable(true).define(["b"], (b) => b);
      const child1 = runtime.module(define2).derive(["a"], main);
      main.import("b", child1);
      return main;
    }

    // Module 2
    // b = 2
    // a
    // import {a} with {b} from "1"
    function define2() {
      const main = runtime.module();
      b2 = main.variable(true).define("b", () => 2);
      a2 = main.variable(true).define(["a"], (a) => a);
      const child1 = runtime.module(define1).derive(["b"], main);
      main.import("a", child1);
      return main;
    }

    define1();

    test.deepEqual(await valueof(a1), {value: 1});
    test.deepEqual(await valueof(b1), {value: 2});
    test.deepEqual(await valueof(a2), {value: 1});
    test.deepEqual(await valueof(b2), {value: 2});
  }
);

tape(
  "variable.import() allows indirect circular import-with if the resulting variables are not circular",
  async test => {
    const runtime = new Runtime();
    let a, b, c, importA, importB, importC;

    // Module 1
    // a = 1
    // c
    // import {c} with {a} from "3"
    function define1() {
      const main = runtime.module();
      a = main.variable(true).define("a", () => 1);
      importC = main.variable(true).define(["c"], (c) => c);
      const child3 = runtime.module(define3).derive(["a"], main);
      main.import("c", child3);
      return main;
    }

    // Module 2
    // b = 2
    // a
    // import {a} with {b} from "1"
    function define2() {
      const main = runtime.module();
      b = main.variable(true).define("b", () => 2);
      importA = main.variable(true).define(["a"], (a) => a);
      const child1 = runtime.module(define1).derive(["b"], main);
      main.import("a", child1);
      return main;
    }

    // Module 3
    // c = 3
    // b
    // import {b} with {c} from "2"
    function define3() {
      const main = runtime.module();
      c = main.variable(true).define("c", () => 3);
      importB = main.variable(true).define(["b"], (b) => b);
      const child2 = runtime.module(define2).derive(["c"], main);
      main.import("b", child2);
      return main;
    }

    define1();

    test.deepEqual(await valueof(a), {value: 1});
    test.deepEqual(await valueof(b), {value: 2});
    test.deepEqual(await valueof(c), {value: 3});
    test.deepEqual(await valueof(importA), {value: 1});
    test.deepEqual(await valueof(importB), {value: 2});
    test.deepEqual(await valueof(importC), {value: 3});
  }
);

tape("variable.import() supports lazy imports", async test => {
  let resolve2, promise2 = new Promise((resolve) => resolve2 = resolve);

  function define1(runtime, observer) {
    const main = runtime.module();
    main.define("module 1", async () => runtime.module(await promise2));
    main.define("a", ["module 1", "@variable"], (_, v) => v.import("a", _));
    main.variable(observer("imported a")).define("imported a", ["a"], a => a);
    return main;
  }

  function define2(runtime, observer) {
    const main = runtime.module();
    main.variable(observer("a")).define("a", [], () => 1);
    return main;
  }

  const runtime = new Runtime();
  const inspectorA = promiseInspector();
  runtime.module(define1, name => {
    if (name === "imported a") {
      return inspectorA;
    }
  });

  await sleep();
  resolve2(define2);
  test.deepEqual(await inspectorA, 1);
});

tape("variable.import() supports lazy transitive imports", async test => {
  let resolve2, promise2 = new Promise((resolve) => resolve2 = resolve);
  let resolve3, promise3 = new Promise((resolve) => resolve3 = resolve);

  function define1(runtime, observer) {
    const main = runtime.module();
    main.define("module 1", async () => runtime.module(await promise2));
    main.define("b", ["module 1", "@variable"], (_, v) => v.import("b", _));
    main.variable(observer("a")).define("a", ["b"], b => b + 1);
    return main;
  }

  function define2(runtime, observer) {
    const main = runtime.module();
    main.define("module 1", async () => runtime.module(await promise3));
    main.define("c", ["module 1", "@variable"], (_, v) => v.import("c", _));
    main.variable(observer("b")).define("b", ["c"], c => c + 1);
    return main;
  }

  function define3(runtime, observer) {
    const main = runtime.module();
    main.variable(observer("c")).define("c", [], () => 1);
    return main;
  }

  const runtime = new Runtime();
  const inspectorA = promiseInspector();
  runtime.module(define1, name => {
    if (name === "a") {
      return inspectorA;
    }
  });

  await sleep();
  resolve2(define2);
  await sleep();
  resolve3(define3);
  test.deepEqual(await inspectorA, 3);
});
