export default function dispatch(node, type) {
  var document = node.ownerDocument, event = document.defaultView.CustomEvent;
  if (typeof event === "function") {
    event = new event(type);
  } else {
    event = document.createEvent("Event");
    event.initEvent(type, false, false);
  }
  node.dispatchEvent(event);
}
