import path from 'path';
import fs from 'fs';

type FileName =
  | 'AppDelegate.mm'
  | 'MainApplication.java'
  | 'AndroidManifest.xml'
  | 'app-build.gradle';

export function getFixture(name: FileName): string {
  const filepath = path.join(__dirname, name);
  return fs.readFileSync(filepath, 'utf8');
}

export function getFixturePath(name: FileName): string {
  return path.join(__dirname, name);
}
