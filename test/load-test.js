import {RuntimeError} from "../src/errors";
import load from "../src/load";
import tape from "./tape";

tape("basic notebook as module loading", {html: "<div id=foo />"}, async test => {
  load({}, {
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
  }, ({name}) => document.querySelector(`#${name}`));
  await sleep(10);
  test.equals(document.querySelector("#foo").firstChild.innerHTML, "101");
});

tape("notebooks as modules with variables depending on other variables", {html: "<div id=foo />"}, async test => {
  load({}, {
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
  }, ({name}) => document.querySelector(`#${name}`));
  await sleep(10);
  test.equals(document.querySelector("#foo").firstChild.innerHTML, "202");
});

tape("notebooks as modules with imports", {html: "<div id=foo />"}, async test => {
  load({}, {
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
  }, ({name}) => document.querySelector(`#${name}`));
  await sleep(10);
  test.equals(document.querySelector("#foo").firstChild.innerHTML, "202");
});

tape("throws an error when trying to import from a nonexistent module", {html: "<div id=foo />"}, async test => {
  try {
    load({}, {
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
    }, ({name}) => document.querySelector(`#${name}`));
  } catch (error) {
    test.equals(error.constructor, RuntimeError);
    test.equals(error.message, 'unable to load module "nope"');
  }
  await sleep(10);
  test.equals(document.querySelector("#foo").firstChild.innerHTML, "101");
});

tape("notebook as modules with the standard library", {html: "<div id=foo /><div id=bar />"}, async test => {
  load({
    bar: 42
  }, {
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
  }, ({name}) => document.querySelector(`#${name}`));
  await sleep(10);
  test.equals(document.querySelector("#foo").firstChild.innerHTML, "84");
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
