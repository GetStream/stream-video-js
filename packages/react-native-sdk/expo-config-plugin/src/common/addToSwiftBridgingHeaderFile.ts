import { Mod, withMod } from '@expo/config-plugins';
import { addObjcImports } from '@expo/config-plugins/build/ios/codeMod';
import { ExpoConfig } from '@expo/config-types';
import fs from 'fs';
import path from 'path';

function findBridgingHeaderName(dir: string): string | null {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const result = findBridgingHeaderName(fullPath);
      if (result) return result; // Return if found in subdirectory
    } else if (file.endsWith('.pbxproj')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const match = content.match(/SWIFT_OBJC_BRIDGING_HEADER\s*=\s*(.*?);/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  return null; // Not found
}

export async function addToSwiftBridgingHeaderFile(
  projectRoot: string,
  action: (contents: string) => string,
) {
  const bridgingHeaderFileName = findBridgingHeaderName(projectRoot);
  if (!bridgingHeaderFileName) {
    console.log('No bridging header found.');
    return;
  }

  const bridgingHeaderFullPath = path.resolve(
    projectRoot,
    `ios/${bridgingHeaderFileName.replace(/['"]/g, '')}`,
  );
  if (!fs.existsSync(bridgingHeaderFullPath)) {
    console.log(`File not found at: ${bridgingHeaderFullPath}`);
    return;
  }

  const contents = await fs.promises.readFile(bridgingHeaderFullPath, 'utf8');

  const newContents = action(contents);

  await fs.promises.writeFile(bridgingHeaderFullPath, newContents);
}
