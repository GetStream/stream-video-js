import path from 'path';
import fs from 'fs';

export function getFixture(
  name: 'AppDelegate.mm' | 'MainApplication.java',
): string {
  const filepath = path.join(__dirname, name);
  return fs.readFileSync(filepath, 'utf8');
}
