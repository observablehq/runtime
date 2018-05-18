import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "./valueof";

tape("variable.define(name, inputs, definition) can define a variable", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define("foo", [], () => 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(inputs, function) can define an anonymous variable", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define([], () => 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(name, function) can define a named variable", {html: "<div id=foo /><div id=bar />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define("foo", () => 42);
  const bar = module.variable("#bar").define("bar", ["foo"], foo => foo);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
  test.deepEqual(await valueof(bar), {value: 42});
});

tape("variable.define(function) can define an anonymous variable", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define(() => 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(null, inputs, value) can define an anonymous constant", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define(null, [], 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(inputs, value) can define an anonymous constant", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define([], 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(null, value) can define an anonymous constant", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define(null, 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define(value) can define an anonymous constant", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define(42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define detects missing inputs", {html: "<div id=foo /><div id=bar />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo");
  const bar = module.variable("#bar").define("bar", ["foo"], foo => foo);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: undefined});
  test.deepEqual(await valueof(bar), {error: "RuntimeError: foo is not defined"});
  foo.define("foo", 1);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 1});
});

tape("variable.define detects duplicate names", {html: "<div id=foo /><div id=bar />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define("foo", 1);
  const bar = module.variable("#bar").define("foo", 2);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {error: "RuntimeError: foo is defined more than once"});
  test.deepEqual(await valueof(bar), {error: "RuntimeError: foo is defined more than once"});
  bar.define("bar", 2);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 2});
});

tape("variable.define recomputes reachability as expected", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const quux = module.define("quux", [], () => 42);
  const baz = module.define("baz", ["quux"], quux => `baz-${quux}`);
  const bar = module.define("bar", ["quux"], quux => `bar-${quux}`);
  const foo = main.variable("#foo").define("foo", ["bar", "baz", "quux"], (bar, baz, quux) => [bar, baz, quux]);
  main.variable().import("bar", module);
  main.variable().import("baz", module);
  main.variable().import("quux", module);
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

tape("variable.define correctly detects reachability for unreachable cycles", {html: "<div id=foo />"}, async test => {
  let returned = false;
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const bar = module.define("bar", ["baz"], baz => `bar-${baz}`);
  const baz = module.define("baz", ["quux"], quux => `baz-${quux}`);
  const quux = module.define("quux", ["zapp"], function*(zapp) { try { while (true) yield `quux-${zapp}`; } finally { returned = true; }});
  const zapp = module.define("zapp", ["bar"], bar => `zaap-${bar}`);
  await new Promise(setImmediate);
  test.equal(bar._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(quux._reachable, false);
  test.equal(zapp._reachable, false);
  test.deepEqual(await valueof(bar), {value: undefined});
  test.deepEqual(await valueof(baz), {value: undefined});
  test.deepEqual(await valueof(quux), {value: undefined});
  test.deepEqual(await valueof(zapp), {value: undefined});
  main.variable().import("bar", module);
  const foo = main.variable("#foo").define("foo", ["bar"], bar => bar);
  await new Promise(setImmediate);
  test.equal(foo._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(baz._reachable, true);
  test.equal(quux._reachable, true);
  test.equal(zapp._reachable, true);
  test.deepEqual(await valueof(bar), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(baz), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(quux), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(zapp), {error: "RuntimeError: circular definition"});
  test.deepEqual(await valueof(foo), {error: "RuntimeError: circular definition"}); // Variables that depend on cycles are themselves circular.
  foo.define("foo", [], () => "foo");
  await new Promise(setImmediate);
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

tape("variable.define terminates previously reachable generators", {html: "<div id=foo />"}, async test => {
  let returned = false;
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const bar = module.define("bar", [], function*() { try { while (true) yield 1; } finally { returned = true; }});
  const foo = main.variable("#foo").define("foo", ["bar"], bar => bar);
  main.variable().import("bar", module);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  foo.define("foo", [], () => "foo");
  await new Promise(setImmediate);
  test.equal(bar._generator, undefined);
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.equal(returned, true);
});

tape("variable.define does not terminate reachable generators", {html: "<div id=foo /><div id=baz />"}, async test => {
  let returned = false;
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const bar = module.define("bar", [], function*() { try { while (true) yield 1; } finally { returned = true; }});
  const baz = main.variable("#baz").define("baz", ["bar"], bar => bar);
  const foo = main.variable("#foo").define("foo", ["bar"], bar => bar);
  main.variable().import("bar", module);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(baz), {value: 1});
  foo.define("foo", [], () => "foo");
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.deepEqual(await valueof(baz), {value: 1});
  test.equal(returned, false);
  bar._invalidate();
  await new Promise(setImmediate);
  test.equal(returned, true);
});

tape("variable.define detects duplicate declarations", {html: "<div id=foo /><div id=bar /><div id=baz />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const v1 = main.variable("#foo").define("foo", [], () => 1);
  const v2 = main.variable("#bar").define("foo", [], () => 2);
  const v3 = main.variable("#baz").define(null, ["foo"], foo => foo);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(v1), {error: "RuntimeError: foo is defined more than once"});
  test.deepEqual(await valueof(v2), {error: "RuntimeError: foo is defined more than once"});
  test.deepEqual(await valueof(v3), {error: "RuntimeError: foo could not be resolved"});
});

tape("variable.define detects missing inputs and erroneous inputs", {html: "<div id=foo /><div id=bar />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const v1 = main.variable("#foo").define("foo", ["baz"], () => 1);
  const v2 = main.variable("#bar").define("bar", ["foo"], () => 2);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(v1), {error: "RuntimeError: baz is not defined"});
  test.deepEqual(await valueof(v2), {error: "RuntimeError: foo could not be resolved"});
});

tape("variable.define allows masking of builtins", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime({color: "red"});
  const main = runtime.module();
  const mask = main.define("color", "green");
  const foo = main.variable("#foo").define(null, ["color"], color => color);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: "green"});
  mask.delete();
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("variable.define supports promises", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], () => new Promise(resolve => setImmediate(() => resolve(42))));
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
});

tape("variable.define supports generator cells", {html: "<div id=foo />"}, async test => {
  let i = 0;
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], function*() { while (i < 3) yield ++i; });
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 3});
});

tape("variable.define supports generator objects", {html: "<div id=foo />"}, async test => {
  function* range(n) { for (let i = 0; i < n; ++i) yield i; }
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], () => range(3));
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 0});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
});

tape("variable.define supports a promise that resolves to a generator object", {html: "<div id=foo />"}, async test => {
  function* range(n) { for (let i = 0; i < n; ++i) yield i; }
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], async () => range(3));
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 0});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
});

tape("variable.define supports generators that yield promises", {html: "<div id=foo />"}, async test => {
  let i = 0;
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], function*() { while (i < 3) yield Promise.resolve(++i); });
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 3});
});

tape("variable.define allows a variable to be redefined", {html: "<div id=foo /><div id=bar />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], () => 1);
  const bar = main.variable("#bar").define("bar", ["foo"], foo => new Promise(resolve => setImmediate(() => resolve(foo))));
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 1});
  foo.define("foo", [], () => 2);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
  test.deepEqual(await valueof(bar), {value: 2});
});

tape("variable.define ignores an asynchronous result from a redefined variable", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], () => new Promise(resolve => setTimeout(() => resolve("fail"), 150)));
  await new Promise(setImmediate);
  foo.define("foo", [], () => "success");
  await new Promise(resolve => setTimeout(resolve, 250));
  test.deepEqual(await valueof(foo), {value: "success"});
  test.deepEqual(foo._value, "success");
});

tape("variable.define ignores an asynchronous result from a redefined input", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const bar = main.variable().define("bar", [], () => new Promise(resolve => setTimeout(() => resolve("fail"), 150)));
  const foo = main.variable("#foo").define("foo", ["bar"], bar => bar);
  await new Promise(setImmediate);
  bar.define("bar", [], () => "success");
  await new Promise(resolve => setTimeout(resolve, 250));
  test.deepEqual(await valueof(foo), {value: "success"});
  test.deepEqual(foo._value, "success");
});

tape("variable.define does not try to compute unreachable variables", {html: "<div id=foo /><div id=bar />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  let evaluated = false;
  const foo = main.variable("#foo").define("foo", [], () => 1);
  const bar = main.variable().define("bar", ["foo"], (foo) => evaluated = foo);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: undefined});
  test.equals(evaluated, false);
});
