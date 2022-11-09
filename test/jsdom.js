import {JSDOM} from "jsdom";

export default function jsdomit(description, run) {
  return it(description, withJsdom(run));
}

jsdomit.skip = (description, run) => {
  return it.skip(description, withJsdom(run));
};

jsdomit.only = (description, run) => {
  return it.only(description, withJsdom(run));
};

function withJsdom(run) {
  return async () => {
    const jsdom = new JSDOM("");
    global.window = jsdom.window;
    global.document = jsdom.window.document;
    global.navigator = jsdom.window.navigator;
    global.Event = jsdom.window.Event;
    global.Element = jsdom.window.Element;
    global.Node = jsdom.window.Node;
    global.NodeList = jsdom.window.NodeList;
    global.Text = jsdom.window.Text;
    global.HTMLCollection = jsdom.window.HTMLCollection;
    try {
      return await run();
    } finally {
      delete global.window;
      delete global.document;
      delete global.navigator;
      delete global.Event;
      delete global.Node;
      delete global.NodeList;
      delete global.HTMLCollection;
    }
  };
}
