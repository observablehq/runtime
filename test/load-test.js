import load from "../src/load";
import tape from "./tape";

tape("basic notebook as module loading", async test => {
  let fulfilled, value = new Promise(resolve => fulfilled = resolve);
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
    if (name === "foo") return {fulfilled};
  });
  test.equals(await value, 101);
});

tape("notebooks as modules with variables depending on other variables", async test => {
  let fulfilled, value = new Promise(resolve => fulfilled = resolve);
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
    if (name === "foo") return {fulfilled};
  });
  test.equals(await value, 202);
});

tape("notebooks as modules with imports", async test => {
  let fulfilled, value = new Promise(resolve => fulfilled = resolve);
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
    if (name === "foo") return {fulfilled};
  });
  test.equals(await value, 202);
});

tape("Rejects with an error when trying to import from a nonexistent module", async test => {
  let rejected, value = new Promise((resolve, reject) => rejected = reject);
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
    if (name === "foo") return {rejected};
  });
  try {
    await value;
    test.fail();
  } catch (error) {
    test.deepEqual(error, {message: "nonexistent could not be resolved", input: "nonexistent"});
  }
});

tape("notebook as modules with builtins", async test => {
  let fulfilled, value = new Promise(resolve => fulfilled = resolve);
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
    if (name === "foo") return {fulfilled};
  });
  test.equals(await value, 84);
});

tape("notebook with the default standard library", async test => {
  let fulfilled, value = new Promise(resolve => fulfilled = resolve);
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
    if (name === "foo") return {fulfilled};
  });
  test.equals((await value).outerHTML, '<div></div>');
});
