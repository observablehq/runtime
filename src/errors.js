export function RuntimeError(message, variable) {
  this.message = message + "";
  this.name = "RuntimeError";
  if (variable) this.variable = variable;
}

RuntimeError.prototype = Object.create(Error.prototype);
RuntimeError.prototype.constructor = RuntimeError;
