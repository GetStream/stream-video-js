// A random id of length 15. (based on https://stackoverflow.com/a/38622545)
export function randomId() {
  return (
    Math.random().toString(36).slice(2, 7) +
    Math.random().toString(36).slice(2, 7) +
    Math.random().toString(36).slice(2, 7)
  );
}
