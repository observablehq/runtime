export function maybeProperty(object, key) {
  try {
    object[key] && object[key].constructor;
  } catch (e) {
    return FORBIDDEN;
  }
  return object[key];
}

export const FORBIDDEN = {};
