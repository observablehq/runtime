import {runtime as createRuntime} from "../";
import "./requestAnimationFrame";
import tape from "./tape";
import valueof from "./valueof";

tape("variable.define recomputes reachability as expected", {html: "<div id=foo></div>"}, async test => {
  const runtime = createRuntime();
  const module = runtime.module();
  const quux = module.variable().define("quux", 42);
  const baz = module.variable().define("baz", ["quux"], quux => `baz-${quux}`);
  const bar = module.variable().define("bar", ["quux"], quux => `bar-${quux}`);
  const foo = module.variable(document.querySelector("#foo")).define("foo", ["bar", "baz", "quux"], (bar, baz, quux) => bar + baz + quux);
  await new Promise(setImmediate);
  test.equal(quux._reachable, true);
  test.equal(baz._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(foo._reachable, true);
  foo.define("foo", "foo");
  await new Promise(setImmediate);
  test.equal(quux._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(bar._reachable, false);
  test.equal(foo._reachable, true);
});

tape("variable.define terminates previously reachable generators", {html: "<div id=foo></div>"}, async test => {
  let returned = false;
  const runtime = createRuntime();
  const module = runtime.module();
  const bar = module.variable().define("bar", function* () { try { while (true) yield 1; } finally { returned = true; }});
  const foo = module.variable(document.querySelector("#foo")).define("foo", ["bar"], bar => bar);
  await new Promise(setImmediate);
  test.equal(bar._reachable, true);
  test.equal(foo._reachable, true);
  foo.define("foo", "foo");
  await new Promise(setImmediate);
  test.equal(bar._reachable, false);
  test.equal(bar._generator, undefined);
  test.equal(foo._reachable, true);
  test.equal(returned, true);
});

tape("variable.define does not terminate reachable generators", {html: "<div id=foo></div><div id=baz></div>"}, async test => {
  let returned = false;
  const runtime = createRuntime();
  const module = runtime.module();
  const bar = module.variable().define("bar", function* () { try { while (true) yield 1; } finally { returned = true; }});
  const baz = module.variable(document.querySelector("#baz")).define("baz", ["bar"], bar => bar);
  const foo = module.variable(document.querySelector("#foo")).define("foo", ["bar"], bar => bar);
  await new Promise(setImmediate);
  test.equal(baz._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(foo._reachable, true);
  foo.define("foo", "foo");
  await new Promise(setImmediate);
  test.equal(baz._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(foo._reachable, true);
  test.equal(returned, false);
  bar._generator.return();
  test.equal(returned, true);
});

tape("variable.define correctly detects reachability for unreachable cycles", {html: "<div id=foo></div>"}, async test => {
  let returned = false;
  const runtime = createRuntime();
  const module = runtime.module();
  const bar = module.variable().define("bar", ["baz"], baz => `bar-${baz}`);
  const baz = module.variable().define("baz", ["quux"], quux => `baz-${quux}`);
  const quux = module.variable().define("quux", ["zapp"], function* (zapp) { try { while (true) yield `quux-${zapp}`; } finally { returned = true; }});
  const zapp = module.variable().define("zapp", ["bar"], bar => `zaap-${bar}`);
  await new Promise(setImmediate);
  test.equal(bar._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(quux._reachable, false);
  test.equal(zapp._reachable, false);
  test.deepEqual(await valueof(bar), {error: "circular definition"});
  test.deepEqual(await valueof(baz), {error: "circular definition"});
  test.deepEqual(await valueof(quux), {error: "circular definition"});
  test.deepEqual(await valueof(zapp), {error: "circular definition"});
  const foo = module.variable("#foo").define("foo", ["bar"], bar => bar);
  await new Promise(setImmediate);
  test.equal(foo._reachable, true);
  test.equal(bar._reachable, true);
  test.equal(baz._reachable, true);
  test.equal(quux._reachable, true);
  test.equal(zapp._reachable, true);
  test.deepEqual(await valueof(foo), {error: "circular definition"}); // Variables that depend on cycles are themselves circular.
  foo.define("foo", "foo");
  await new Promise(setImmediate);
  test.equal(foo._reachable, true);
  test.equal(bar._reachable, false);
  test.equal(baz._reachable, false);
  test.equal(quux._reachable, false);
  test.equal(zapp._reachable, false);
  test.deepEqual(await valueof(foo), {value: "foo"});
  test.deepEqual(await valueof(bar), {error: "circular definition"});
  test.equal(returned, false); // Generator is never finalized because it has never run.
});
