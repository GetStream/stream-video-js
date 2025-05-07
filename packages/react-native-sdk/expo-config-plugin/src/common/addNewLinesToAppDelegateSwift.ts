export default function addNewLinesToAppDelegateSwift(
  content: string,
  toAdd: string[],
) {
  const lines = content.split('\n');
  let appDelegateDeclarationLine = -1;

  // 1. Find the AppDelegate class declaration line
  // Regex to find "class AppDelegate" ensuring it's a whole word.
  // This handles variations like "@main class AppDelegate:", "class AppDelegate : UIResponder", etc.
  const appDelegateRegex = /class\s+AppDelegate\b/;
  for (let i = 0; i < lines.length; i++) {
    if (appDelegateRegex.test(lines[i])) {
      appDelegateDeclarationLine = i;
      break;
    }
  }

  if (appDelegateDeclarationLine === -1) {
    throw new Error(
      'AppDelegate class definition not found in Swift file. Could not find a line matching "class AppDelegate".',
    );
  }

  // 2. Find the closing brace '}' for the AppDelegate class
  let braceLevel = 0;
  let foundAppDelegateOpeningBrace = false;
  let closingBraceLineIndex = -1;

  for (let i = appDelegateDeclarationLine; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '{') {
        if (i >= appDelegateDeclarationLine) {
          // Ensure we only start counting after or on the declaration line
          foundAppDelegateOpeningBrace = true;
          braceLevel++;
        }
      } else if (char === '}') {
        if (foundAppDelegateOpeningBrace) {
          braceLevel--;
          if (braceLevel === 0) {
            closingBraceLineIndex = i; // This line contains the closing brace
            break; // Exit character loop
          }
        }
      }
    }
    if (closingBraceLineIndex !== -1) {
      break; // Exit line loop, closing brace found
    }
  }

  if (closingBraceLineIndex === -1) {
    throw new Error(
      'Malformed AppDelegate in Swift file. Could not find the matching closing brace "}" for the AppDelegate class.',
    );
  }
  toAdd.unshift('');
  let insertionLineIndex = closingBraceLineIndex;
  for (const newLine of toAdd) {
    lines.splice(insertionLineIndex, 0, newLine);
    insertionLineIndex++; // Increment to insert subsequent lines after the previously added one
  }
  return lines.join('\n');
}
