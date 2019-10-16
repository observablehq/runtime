import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "./valueof";

tape("variable.define(name, inputs, definition) can define a variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define("foo", [], () => 42);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(inputs, function) can define an anonymous variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define([], () => 42);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(name, function) can define a named variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define("foo", () => 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo);
  test.deepEqual(await valueof(foo), {value: 42});
  test.deepEqual(await valueof(bar), {value: 42});
});

tape("variable.define(function) can define an anonymous variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define(() => 42);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(null, inputs, value) can define an anonymous constant", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define(null, [], 42);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(inputs, value) can define an anonymous constant", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define([], 42);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(null, value) can define an anonymous constant", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define(null, 42);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(value) can define an anonymous constant", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define(42);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define detects missing inputs", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo);
  test.deepEqual(await valueof(foo), {value: undefined});
  test.deepEqual(await valueof(bar), {error: "RuntimeError: foo is not defined"});
  foo.define("foo", 1);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 1});
});

tape("variable.define detects duplicate names", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define("foo", 1);
  const bar = module.variable(true).define("foo", 2);
  test.deepEqual(await valueof(foo), {error: "RuntimeError: foo is defined more than once"});
  test.deepEqual(await valueof(bar), {error: "RuntimeError: foo is defined more than once"});
  bar.define("bar", 2);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 2});
});

tape("variable.define recomputes reachability as expected", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const quux = module.define("quux", [], () => 42);
  const baz = module.define("baz", ["quux"], quux => `baz-${quux}`);
  const bar = module.define("bar", ["quux"], quux => `bar-${quux}`);
  const foo = main.variable(true).define("foo", ["bar", "baz", "quux"], (bar, baz, quux) => [bar, baz, quux]);
  main.variable().import("bar", module);
  main.variable().import("baz", module);
  main.variable().import("quux", module);
  await runtime._compute();
  test.equal(quux._reachable, true);
  test.equal(baz._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(foo._reachable, true);
  test.deepEqual(await valueof(foo), {value: ["bar-42", "baz-42", 42]});
  foo.define("foo", [], () => "foo");
  await runtime._compute();
  test.equal(quux._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(bar._reachable, false);
  test.equal(foo._reachable, true);
  test.deepEqual(await valueof(foo), {value: "foo"});
});

tape("variable.define correctly detects reachability for unreachable cycles", async test => {
  let returned = false;
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const bar = module.define("bar", ["baz"], baz => `bar-${baz}`);
  const baz = module.define("baz", ["quux"], quux => `baz-${quux}`);
  const quux = module.define("quux", ["zapp"], function*(zapp) { try { while (true) yield `quux-${zapp}`; } finally { returned = true; }});
  const zapp = module.define("zapp", ["bar"], bar => `zaap-${bar}`);
  await runtime._compute();
  test.equal(bar._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(quux._reachable, false);
  test.equal(zapp._reachable, false);
  test.deepEqual(await valueof(bar), {value: undefined});
  test.deepEqual(await valueof(baz), {value: undefined});
  test.deepEqual(await valueof(quux), {value: undefined});
  test.deepEqual(await valueof(zapp), {value: undefined});
  main.variable().import("bar", module);
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  await runtime._compute();
  test.equal(foo._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(baz._reachable, true);
  test.equal(quux._reachable, true);
  test.equal(zapp._reachable, true);
  test.deepEqual(await valueof(bar), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(baz), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(quux), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(zapp), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(foo), {error: "RuntimeError: bar could not be resolved"});
  foo.define("foo", [], () => "foo");
  await runtime._compute();
  test.equal(foo._reachable, true);
  test.equal(bar._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(quux._reachable, false);
  test.equal(zapp._reachable, false);
  test.deepEqual(await valueof(bar), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(baz), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(quux), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(zapp), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.equal(returned, false); // Generator is never finalized because it has never run.
});

tape("variable.define terminates previously reachable generators", async test => {
  let returned = false;
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const bar = module.define("bar", [], function*() { try { while (true) yield 1; } finally { returned = true; }});
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  main.variable().import("bar", module);
  test.deepEqual(await valueof(foo), {value: 1});
  foo.define("foo", [], () => "foo");
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.equal(bar._generator, undefined);
  test.equal(returned, true);
});

tape("variable.define does not terminate reachable generators", async test => {
  let returned = false;
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const bar = module.define("bar", [], function*() { try { while (true) yield 1; } finally { returned = true; }});
  const baz = main.variable(true).define("baz", ["bar"], bar => bar);
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  main.variable().import("bar", module);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(baz), {value: 1});
  foo.define("foo", [], () => "foo");
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.deepEqual(await valueof(baz), {value: 1});
  test.equal(returned, false);
  bar._invalidate();
  await runtime._compute();
  test.equal(returned, true);
});

tape("variable.define detects duplicate declarations", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const v1 = main.variable(true).define("foo", [], () => 1);
  const v2 = main.variable(true).define("foo", [], () => 2);
  const v3 = main.variable(true).define(null, ["foo"], foo => foo);
  test.deepEqual(await valueof(v1), {error: "RuntimeError: foo is defined more than once"});
  test.deepEqual(await valueof(v2), {error: "RuntimeError: foo is defined more than once"});
  test.deepEqual(await valueof(v3), {error: "RuntimeError: foo could not be resolved"});
});

tape("variable.define detects missing inputs and erroneous inputs", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const v1 = main.variable(true).define("foo", ["baz"], () => 1);
  const v2 = main.variable(true).define("bar", ["foo"], () => 2);
  test.deepEqual(await valueof(v1), {error: "RuntimeError: baz is not defined"});
  test.deepEqual(await valueof(v2), {error: "RuntimeError: foo could not be resolved"});
});

tape("variable.define allows masking of builtins", async test => {
  const runtime = new Runtime({color: "red"});
  const main = runtime.module();
  const mask = main.define("color", "green");
  const foo = main.variable(true).define(null, ["color"], color => color);
  test.deepEqual(await valueof(foo), {value: "green"});
  mask.delete();
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("variable.define supports promises", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], () => new Promise(resolve => setImmediate(() => resolve(42))));
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define supports generator cells", async test => {
  let i = 0;
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], function*() { while (i < 3) yield ++i; });
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(foo), {value: 2});
  test.deepEqual(await valueof(foo), {value: 3});
});

tape("variable.define supports generator objects", async test => {
  function* range(n) { for (let i = 0; i < n; ++i) yield i; }
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], () => range(3));
  test.deepEqual(await valueof(foo), {value: 0});
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(foo), {value: 2});
});

tape("variable.define supports a promise that resolves to a generator object", async test => {
  function* range(n) { for (let i = 0; i < n; ++i) yield i; }
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], async () => range(3));
  test.deepEqual(await valueof(foo), {value: 0});
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(foo), {value: 2});
});

tape("variable.define supports generators that yield promises", async test => {
  let i = 0;
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], function*() { while (i < 3) yield Promise.resolve(++i); });
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(foo), {value: 2});
  test.deepEqual(await valueof(foo), {value: 3});
});

tape("variable.define allows a variable to be redefined", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], () => 1);
  const bar = main.variable(true).define("bar", ["foo"], foo => new Promise(resolve => setImmediate(() => resolve(foo))));
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 1});
  foo.define("foo", [], () => 2);
  test.deepEqual(await valueof(foo), {value: 2});
  test.deepEqual(await valueof(bar), {value: 2});
});

tape("variable.define ignores an asynchronous result from a redefined variable", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], () => new Promise(resolve => setTimeout(() => resolve("fail"), 150)));
  await new Promise(setImmediate);
  foo.define("foo", [], () => "success");
  await new Promise(resolve => setTimeout(resolve, 250));
  test.deepEqual(await valueof(foo), {value: "success"});
  test.deepEqual(foo._value, "success");
});

tape("variable.define ignores an asynchronous result from a redefined input", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const bar = main.variable().define("bar", [], () => new Promise(resolve => setTimeout(() => resolve("fail"), 150)));
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  await new Promise(setImmediate);
  bar.define("bar", [], () => "success");
  await new Promise(resolve => setTimeout(resolve, 250));
  test.deepEqual(await valueof(foo), {value: "success"});
  test.deepEqual(foo._value, "success");
});

tape("variable.define does not try to compute unreachable variables", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  let evaluated = false;
  const foo = main.variable(true).define("foo", [], () => 1);
  const bar = main.variable().define("bar", ["foo"], (foo) => evaluated = foo);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: undefined});
  test.equals(evaluated, false);
});

tape("variable.define does not try to compute unreachable variables that are outputs of reachable variables", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  let evaluated = false;
  const foo = main.variable(true).define("foo", [], () => 1);
  const bar = main.variable(true).define("bar", [], () => 2);
  const baz = main.variable().define("baz", ["foo", "bar"], (foo, bar) => evaluated = foo + bar);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 2});
  test.deepEqual(await valueof(baz), {value: undefined});
  test.equals(evaluated, false);
});

tape("variable.define can reference whitelisted globals", async test => {
  const runtime = new Runtime(null, name => name === "magic" ? 21 : undefined);
  const module = runtime.module();
  const foo = module.variable(true).define(["magic"], magic => magic * 2);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define captures the value of whitelisted globals", async test => {
  let magic = 0;
  const runtime = new Runtime(null, name => name === "magic" ? ++magic : undefined);
  const module = runtime.module();
  const foo = module.variable(true).define(["magic"], magic => magic * 2);
  test.deepEqual(await valueof(foo), {value: 2});
  test.deepEqual(await valueof(foo), {value: 2});
});

tape("variable.define can override whitelisted globals", async test => {
  const runtime = new Runtime(null, name => name === "magic" ? 1 : undefined);
  const module = runtime.module();
  module.variable().define("magic", [], () => 2);
  const foo = module.variable(true).define(["magic"], magic => magic * 2);
  test.deepEqual(await valueof(foo), {value: 4});
});

tape("variable.define can dynamically override whitelisted globals", async test => {
  const runtime = new Runtime(null, name => name === "magic" ? 1 : undefined);
  const module = runtime.module();
  const foo = module.variable(true).define(["magic"], magic => magic * 2);
  test.deepEqual(await valueof(foo), {value: 2});
  module.variable().define("magic", [], () => 2);
  test.deepEqual(await valueof(foo), {value: 4});
});

tape("variable.define cannot reference non-whitelisted globals", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define(["magic"], magic => magic * 2);
  test.deepEqual(await valueof(foo), {error: "RuntimeError: magic is not defined"});
});

tape("variable.define correctly handles globals that throw", async test => {
  const runtime = new Runtime(null, name => { if (name === "oops") throw new Error("oops"); });
  const module = runtime.module();
  const foo = module.variable(true).define(["oops"], oops => oops);
  test.deepEqual(await valueof(foo), {error: "RuntimeError: oops could not be resolved"});
});
