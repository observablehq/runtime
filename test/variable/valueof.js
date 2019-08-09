export default async function valueof(variable) {
  await variable._module._runtime._computing;
  try { return {value: await variable._promise}; }
  catch (error) { return {error: error.toString()}; }
}
