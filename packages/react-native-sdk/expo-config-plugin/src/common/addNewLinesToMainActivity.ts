export default function addNewLinesToMainActivity(
  content: string,
  toAdd: string[],
) {
  const lines = content.trim().split('\n');
  let lineIndex = lines.length - 1;
  if (lines[lineIndex] !== '}') {
    throw Error('Malformed main activity');
  }
  toAdd.unshift('');
  for (const newLine of toAdd) {
    lines.splice(lineIndex, 0, newLine);
    lineIndex++;
  }
  return lines.join('\n');
}
