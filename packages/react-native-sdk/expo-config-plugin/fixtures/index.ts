import path from 'path';
import fs from 'fs';

type FileNames =
  | 'AppDelegate.mm'
  | 'MainActivity.java'
  | 'MainApplication.java'
  | 'AndroidManifest.xml';

export function getFixture(name: FileNames): string {
  const filepath = path.join(__dirname, name);
  return fs.readFileSync(filepath, 'utf8');
}

export function getFixturePath(name: FileNames): string {
  return path.join(__dirname, name);
}
