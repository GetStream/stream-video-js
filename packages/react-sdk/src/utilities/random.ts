export function getRandomUppercaseChar() {
  var r = Math.floor(Math.random() * 26);
  return String.fromCharCode(65 + r);
}

export function generateCode() {
  var prefix = new Array(2)
      .fill(() => getRandomUppercaseChar())
      .map(() => getRandomUppercaseChar())
      .join(''),
    integer = Math.floor(Math.random() * 9999 * 7);
  return prefix + integer;
}
