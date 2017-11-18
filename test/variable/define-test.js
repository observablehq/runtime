import {runtime as createRuntime} from "../../";
import tape from "../tape";
import valueof from "./valueof";

tape("variable.define(name, inputs, resolver) can define a resolved value", async test => {
  const runtime = createRuntime();
  const module = runtime.module();
  const foo = module.define("foo", [], () => 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(name, inputs, resolver, rejected) can resolve a rejected value", async test => {
  const runtime = createRuntime();
  const module = runtime.module();
  const foo = module.define("foo", [], () => { throw new Error("foo"); });
  const bar = module.define("bar", ["foo"], () => {}, error => error.message);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {error: "foo"});
  test.deepEqual(await valueof(bar), {value: "foo"});
});

tape("variable.define recomputes reachability as expected", async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const weak = runtime.weakModule();
  const quux = weak.define("quux", [], () => 42);
  const baz = weak.define("baz", ["quux"], quux => `baz-${quux}`);
  const bar = weak.define("bar", ["quux"], quux => `bar-${quux}`);
  const foo = main.define("foo", ["bar", "baz", "quux"], (bar, baz, quux) => [bar, baz, quux]);
  main.import("bar", weak);
  main.import("baz", weak);
  main.import("quux", weak);
  await new Promise(setImmediate);
  test.equal(quux._reachable, true);
  test.equal(baz._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(foo._reachable, true);
  test.deepEqual(await valueof(foo), {value: ["bar-42", "baz-42", 42]});
  foo.define("foo", [], () => "foo");
  await new Promise(setImmediate);
  test.equal(quux._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(bar._reachable, false);
  test.equal(foo._reachable, true);
  test.deepEqual(await valueof(foo), {value: "foo"});
});

tape("variable.define correctly detects reachability for unreachable cycles", async test => {
  let returned = false;
  const runtime = createRuntime();
  const main = runtime.module();
  const weak = runtime.weakModule();
  const bar = weak.define("bar", ["baz"], baz => `bar-${baz}`);
  const baz = weak.define("baz", ["quux"], quux => `baz-${quux}`);
  const quux = weak.define("quux", ["zapp"], function*(zapp) { try { while (true) yield `quux-${zapp}`; } finally { returned = true; }});
  const zapp = weak.define("zapp", ["bar"], bar => `zaap-${bar}`);
  await new Promise(setImmediate);
  test.equal(bar._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(quux._reachable, false);
  test.equal(zapp._reachable, false);
  test.deepEqual(await valueof(bar), {value: undefined});
  test.deepEqual(await valueof(baz), {value: undefined});
  test.deepEqual(await valueof(quux), {value: undefined});
  test.deepEqual(await valueof(zapp), {value: undefined});
  main.import("bar", weak);
  const foo = main.define("foo", ["bar"], bar => bar);
  await new Promise(setImmediate);
  test.equal(foo._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(baz._reachable, true);
  test.equal(quux._reachable, true);
  test.equal(zapp._reachable, true);
  test.deepEqual(await valueof(bar), {error: "circular definition"});
  test.deepEqual(await valueof(baz), {error: "circular definition"});
  test.deepEqual(await valueof(quux), {error: "circular definition"});
  test.deepEqual(await valueof(zapp), {error: "circular definition"});
  test.deepEqual(await valueof(foo), {error: "circular definition"}); // Variables that depend on cycles are themselves circular.
  foo.define("foo", [], () => "foo");
  await new Promise(setImmediate);
  test.equal(foo._reachable, true);
  test.equal(bar._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(quux._reachable, false);
  test.equal(zapp._reachable, false);
  test.deepEqual(await valueof(bar), {error: "circular definition"});
  test.deepEqual(await valueof(baz), {error: "circular definition"});
  test.deepEqual(await valueof(quux), {error: "circular definition"});
  test.deepEqual(await valueof(zapp), {error: "circular definition"});
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.equal(returned, false); // Generator is never finalized because it has never run.
});

tape("variable.define terminates previously reachable generators", async test => {
  let returned = false;
  const runtime = createRuntime();
  const main = runtime.module();
  const weak = runtime.weakModule();
  const bar = weak.define("bar", [], function*() { try { while (true) yield 1; } finally { returned = true; }});
  const foo = main.define("foo", ["bar"], bar => bar);
  main.import("bar", weak);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  foo.define("foo", [], () => "foo");
  await new Promise(setImmediate);
  test.equal(bar._generator, undefined);
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.equal(returned, true);
});

tape("variable.define does not terminate reachable generators", async test => {
  let returned = false;
  const runtime = createRuntime();
  const main = runtime.module();
  const weak = runtime.weakModule();
  const bar = weak.define("bar", [], function*() { try { while (true) yield 1; } finally { returned = true; }});
  const baz = main.define("baz", ["bar"], bar => bar);
  const foo = main.define("foo", ["bar"], bar => bar);
  main.import("bar", weak);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(baz), {value: 1});
  foo.define("foo", [], () => "foo");
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.deepEqual(await valueof(baz), {value: 1});
  test.equal(returned, false);
  bar._generator.return();
  test.equal(returned, true);
});

tape("variable.define detects duplicate declarations", async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const v1 = main.define("foo", [], () => 1);
  const v2 = main.define("foo", [], () => 2);
  const v3 = main.define(null, ["foo"], foo => foo);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(v1), {error: "foo is defined more than once"});
  test.deepEqual(await valueof(v2), {error: "foo is defined more than once"});
  test.deepEqual(await valueof(v3), {error: "foo is defined more than once"});
});

tape("variable.define does not allow a variable to mask a builtin", async test => {
  let result;
  const runtime = createRuntime({color: "red"});
  const main = runtime.module();
  main.define("color", [], () => test.fail());
  main.define(null, ["color"], color => result = color);
  await new Promise(setImmediate);
  test.equal(result, "red");
});

tape("variable.define supports promises", async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const foo = main.define("foo", [], () => new Promise(resolve => setImmediate(() => resolve(42))));
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define supports generators", async test => {
  let i = 0;
  const runtime = createRuntime();
  const main = runtime.module();
  const foo = main.define("foo", [], function*() { while (true) yield ++i; });
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 3});
  foo._generator.return();
});

tape("variable.define supports asynchronous generators", async test => {
  let i = 0;
  const runtime = createRuntime();
  const main = runtime.module();
  const foo = main.define("foo", [], function*() { while (true) yield Promise.resolve(++i); });
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 3});
  foo._generator.return();
});

tape("variable.define allows a variable to be redefined", async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const foo = main.define("foo", [], () => 1);
  const bar = main.define("bar", ["foo"], foo => new Promise(resolve => setImmediate(() => resolve(foo))));
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 1});
  foo.define("foo", [], () => 2);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
  test.deepEqual(await valueof(bar), {value: 2});
});
