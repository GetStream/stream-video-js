export default function addNewLinesToAppDelegate(
  content: string,
  toAdd: string[],
) {
  const lines = content.split('\n');
  let lineIndex = lines.findIndex((line) => line.match('@end'));
  if (lineIndex < 0) {
    throw Error('Malformed app delegate');
  }
  toAdd.unshift('');
  lineIndex -= 1;
  for (const newLine of toAdd) {
    lines.splice(lineIndex, 0, newLine);
    lineIndex++;
  }
  return lines.join('\n');
}
