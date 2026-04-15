import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import transform from '../use-call-state-hooks-transform';
import { runTransform } from './runTransform';

const fixtures = ['component', 'renamed-destructuring', 'already-hoisted'];

const fixturesDir = path.join(
  __dirname,
  '..',
  '__testfixtures__',
  'use-call-state-hooks',
);

function read(name) {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf8').trim();
}

describe('use-call-state-hooks codemod', () => {
  for (const fixture of fixtures) {
    it(`transforms ${fixture}`, () => {
      const input = read(`${fixture}.input.tsx`);
      const expected = read(`${fixture}.output.tsx`);

      const result = runTransform(transform, input).trim();

      expect(result).toBe(expected);
    });
  }
});
