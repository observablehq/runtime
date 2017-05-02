export default function variable_release(variable) {
  if (--variable._exdegree === 0) variable.delete();
}
