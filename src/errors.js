export function ResolutionError(message) {
  this.message = message + "";
  this.name = "ResolutionError";
}

ResolutionError.prototype = Object.create(Error.prototype);
ResolutionError.prototype.constructor = ResolutionError;

export function UndefinedError(message) {
  this.message = message;
}
