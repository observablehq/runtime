import {RuntimeError} from "../src/errors";
import load from "../src/load";
import tape from "./tape";

tape("basic notebook as module loading", {html: "<div id=foo />"}, async test => {
  let resolve, value = new Promise(_ => resolve = _);
  load({
    id: "notebook@1",
    modules: [
      {
        id: "notebook@1",
        variables: [
          {
            name: "foo",
            value: () => 101
          }
        ]
      }
    ]
  }, null, ({name}) => {
    if (name == "foo") return {fulfilled: resolve};
  });
  await new Promise(requestAnimationFrame);
  test.equals(await value, 101);
});

tape("notebooks as modules with variables depending on other variables", {html: "<div id=foo />"}, async test => {
  let resolve, value = new Promise(_ => resolve = _);
  load({
    id: "notebook@1",
    modules: [
      {
        id: "notebook@1",
        variables: [
          {
            name: "foo",
            inputs: ["bar"],
            value: bar => bar * 2
          },
          {
            name: "bar",
            value: () => 101
          }
        ]
      }
    ]
  }, null, ({name}) => {
    if (name == "foo") return {fulfilled: resolve};
  });
  await new Promise(requestAnimationFrame);
  test.equals(await value, 202);
});

tape("notebooks as modules with imports", {html: "<div id=foo />"}, async test => {
  let resolve, value = new Promise(_ => resolve = _);
  load({
    id: "notebook@1",
    modules: [
      {
        id: "notebook@1",
        variables: [
          {
            name: "foo",
            inputs: ["bar"],
            value: bar => bar * 2
          },
          {
            from: "notebook@2",
            name: "bar",
            remote: "baz"
          }
        ]
      },
      {
        id: "notebook@2",
        variables: [
          {
            name: "baz",
            value: () => 101
          }
        ]
      }
    ]
  }, null, ({name}) => {
    if (name == "foo") return {fulfilled: resolve};
  });
  await new Promise(requestAnimationFrame);
  test.equals(await value, 202);
});

tape.skip("Rejects with an error when trying to import from a nonexistent module", {html: "<div id=foo />"}, async test => {
  let resolve, reject, value = new Promise((y, n) => (resolve = y, reject = n));
  load({
    id: "notebook@1",
    modules: [
      {
        id: "notebook@1",
        variables: [
          {
            name: "foo",
            value: () => 101
          },
          {
            name: "nonexistent",
            remote: "nonexistent",
            from: "nope"
          }
        ]
      }
    ]
  }, null, ({name}) => {
    return {fulfilled: resolve, rejected: reject};
  });
  await new Promise(requestAnimationFrame);
  try { await value; test.fail(); }
  catch (error) { test.equal(error.toString(), "RuntimeError: nonexistent is not defined"); }
});

tape("notebook as modules with the standard library", {html: "<div id=foo /><div id=bar />"}, async test => {
  let resolve, value = new Promise(_ => resolve = _);
  load({
    id: "notebook@1",
    modules: [
      {
        id: "notebook@1",
        variables: [
          {
            name: "foo",
            inputs: ["bar"],
            value: bar => bar * 2
          }
        ]
      }
    ]
  }, {
    bar: 42
  }, ({name}) => {
    if (name == "foo") return {fulfilled: resolve};
  });
  await new Promise(requestAnimationFrame);
  test.equals(await value, 84);
});
