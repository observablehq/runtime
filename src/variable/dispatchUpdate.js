export default function dispatchUpdate(node) {
  var document = node.ownerDocument, event = document.defaultView.CustomEvent;
  if (typeof event === "function") {
    event = new event("update");
  } else {
    event = document.createEvent("Event");
    event.initEvent("update", false, false);
  }
  node.dispatchEvent(event);
}
