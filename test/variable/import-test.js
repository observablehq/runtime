import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "./valueof";

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
  test.deepEqual(await valueof(afoobar), {error: "RuntimeError: foo could not be resolved"});
  test.deepEqual(await valueof(bbarfoo), {error: "RuntimeError: bar could not be resolved"});
});

tape(
  "variable.import() fails to resolve variables derived from a direct circular import with",
  async test => {
    const runtime = new Runtime();
    let a1, b1, a2, b2;

    function define1() {
      const main = runtime.module();
      a1 = main.variable(true).define("a", function() {
        return 1;
      });
      b1 = main.variable(true).define(["b"], function(b) {
        return b;
      });
      const child1 = runtime.module(define2).derive(["a"], main);
      main.import("b", child1);
      return main;
    }

    function define2() {
      const main = runtime.module();
      b2 = main.variable(true).define("b", function() {
        return 2;
      });
      a2 = main.variable(true).define(["a"], function(a) {
        return a;
      });
      const child1 = runtime.module(define1).derive(["b"], main);
      main.import("a", child1);
      return main;
    }
    define1();

    test.deepEqual(await valueof(a1), {value: 1});
    test.deepEqual(await valueof(b1), {error: 'RuntimeError: b could not be resolved'});
    test.deepEqual(await valueof(a2), {error: 'RuntimeError: a could not be resolved'});
    test.deepEqual(await valueof(b2), {value: 2});
  }
);

tape(
  "variable.import() also fails to resolve variables derived from an indirectly circular import with",
  async test => {
    const runtime = new Runtime();
    let a, b, c, importA, importB, importC;

    function define1() {
      const main = runtime.module();
      a = main.variable(true).define("a", function() {
        return 1;
      });
      importC = main.variable(true).define(["c"], function(c) {
        return c;
      });
      const child3 = runtime.module(define3).derive(["a"], main);
      main.import("c", child3);
      return main;
    }

    function define2() {
      const main = runtime.module();
      b = main.variable(true).define("b", function() {
        return 2;
      });
      importA = main.variable(true).define(["a"], function(a) {
        return a;
      });
      const child1 = runtime.module(define1).derive(["b"], main);
      main.import("a", child1);
      return main;
    }

    function define3() {
      const main = runtime.module();
      c = main.variable(true).define("c", function() {
        return 3;
      });
      importB = main.variable(true).define(["b"], function(b) {
        return b;
      });
      const child2 = runtime.module(define2).derive(["c"], main);
      main.import("b", child2);
      return main;
    }

    define1();

    test.deepEqual(await valueof(a), {value: 1});
    test.deepEqual(await valueof(b), {value: 2});
    test.deepEqual(await valueof(c), {value: 3});
    test.deepEqual(await valueof(importA), {error: 'RuntimeError: a could not be resolved'});
    test.deepEqual(await valueof(importB), {error: 'RuntimeError: b could not be resolved'});
    test.deepEqual(await valueof(importC), {error: 'RuntimeError: c could not be resolved'});
  }
);
