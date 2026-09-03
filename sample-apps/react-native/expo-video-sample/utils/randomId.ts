// A short, lowercase alphanumeric id of up to 6 chars, easy to type by hand.
export function randomId() {
  return Math.random().toString(36).slice(2, 8);
}
