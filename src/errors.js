export function RuntimeError(message, input, cause) {
  this.message = message + "";
  this.input = input;
  this.cause = cause;
}

RuntimeError.prototype = Object.create(Error.prototype);
RuntimeError.prototype.name = "RuntimeError";
RuntimeError.prototype.constructor = RuntimeError;
