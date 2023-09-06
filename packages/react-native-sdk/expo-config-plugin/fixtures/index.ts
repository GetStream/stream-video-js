import path from 'path';
import fs from 'fs';

export function getFixture(
  name: 'AppDelegate.mm' | 'MainApplication.java' | 'AndroidManifest.xml',
): string {
  const filepath = path.join(__dirname, name);
  return fs.readFileSync(filepath, 'utf8');
}

export function getFixturePath(
  name: 'AppDelegate.mm' | 'MainApplication.java' | 'AndroidManifest.xml',
): string {
  return path.join(__dirname, name);
}
