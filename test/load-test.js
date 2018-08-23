import load from "../src/load";
import tape from "./tape";

tape("basic notebook as module loading", async test => {
  let result = null;
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
    if (name == "foo") return {fulfilled: (value) => result = value};
  });
  await sleep(10);
  test.equals(result, 101);
});

tape("notebooks as modules with variables depending on other variables", async test => {
  let result = null;
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
    if (name == "foo") return {fulfilled: (value) => result = value};
  });
  await sleep(10);
  test.equals(result, 202);
});

tape("notebooks as modules with imports", async test => {
  let result = null;
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
    if (name == "foo") return {fulfilled: (value) => result = value};
  });
  await sleep(10);
  test.equals(result, 202);
});

tape("Rejects with an error when trying to import from a nonexistent module", async test => {
  const failures = [];
  load({
    id: "notebook@1",
    modules: [
      {
        id: "notebook@1",
        variables: [
          {
            name: "foo",
            inputs: ["nonexistent"],
            value: nonexistent => nonexistent
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
    return {
      rejected: (error) => failures.push({name, type: error.constructor.name, message: error.message})
    };
  });
  await sleep(10);
  test.deepEquals(failures, [
    {name: "foo", type: "RuntimeError", message: "nonexistent could not be resolved"}
  ]);
});

tape("notebook as modules with builtins", async test => {
  let result = null;
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
    if (name == "foo") return {fulfilled: (value) => result = value};
  });
  await sleep(10);
  test.equals(result, 84);
});

tape("notebook with the default standard library", async test => {
  let result = null;
  load({
    id: "notebook@1",
    modules: [
      {
        id: "notebook@1",
        variables: [
          {
            name: "foo",
            inputs: ["html"],
            value: html => html`<div>`
          }
        ]
      }
    ]
  }, null, ({name}) => {
    if (name == "foo") return {fulfilled: (value) => result = value};
  });
  await sleep(10);
  test.equals(result.outerHTML, '<div></div>');
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
