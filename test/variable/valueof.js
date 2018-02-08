export default async function valueof(variable) {
  try { return {value: await variable._promise}; }
  catch (error) { return {error: error.toString()}; }
}
