import {load} from "../src/index";
import tape from "./tape";

tape("basic notebook as module loading", {html: "<div id=foo />"}, async test => {
  load({id: "notebook@1", modules: [{
    id: "notebook@1",
    variables: [{
      name: "foo",
      value: () => 101
    }]
  }]}, {foo: "#foo"});
  await sleep(10);
  test.equals(document.getElementById("foo").firstChild.innerHTML, "101");
});

tape("notebooks as modules with variables depending on other variables", {html: "<div id=foo />"}, async test => {
  load({id: "notebook@1", modules: [{
    id: "notebook@1",
    variables: [{
      name: "foo",
      inputs: ["bar"],
      value: (bar) => bar * 2
    }, {
      name: "bar",
      value: () => 101
    }]
  }]}, {foo: "#foo"});
  await sleep(10);
  test.equals(document.getElementById("foo").firstChild.innerHTML, "202");
});

// tape.only("notebook as modules with the standard library and views", {html: "<div id=foo /><div id=bar />"}, async test => {
//   load({id: "notebook@1", modules: [{
//     id: "notebook@1",
//     variables: [{
//       name: "foo",
//       view: true,
//       inputs: ["DOM"],
//       value: (DOM) => DOM.range(0, 100)
//     }, {
//       name: "bar",
//       inputs: ["foo"],
//       value: (foo) => foo
//     }]
//   }]}, {foo: "#foo", bar: "#bar"});
//   await sleep(10);
//   test.equals(document.getElementById("bar").firstChild.innerHTML, "50");
// });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
