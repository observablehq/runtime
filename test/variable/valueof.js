export default async function valueof(variable) {
  try { return {value: await variable._value}; }
  catch (error) { return {error: error.toString()}; }
}
