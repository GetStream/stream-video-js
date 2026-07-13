import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseEntries,
  parseDependencyUpdates,
  parseOwnChanges,
} from './changelog.mts';
import { CLIENT_CL, REACT_SDK_CL, BINDINGS_CL } from './changelog.fixtures.mts';

test('parseEntries splits on version headers, newest first', () => {
  const entries = parseEntries(CLIENT_CL);
  assert.equal(entries.length, 4);
  assert.equal(entries[0].version, '1.53.2');
  assert.equal(entries[1].version, '1.53.1');
  assert.equal(entries[3].version, '1.52.0');
  assert.match(entries[0].headerLine, /^## \[1\.53\.2\]/);
});

test('parseDependencyUpdates extracts name + version from the Dependency Updates block', () => {
  const top = parseEntries(REACT_SDK_CL)[0];
  const deps = parseDependencyUpdates(top.body);
  assert.deepEqual(deps, [
    { name: '@stream-io/video-client', version: '1.53.2' },
    { name: '@stream-io/video-react-bindings', version: '1.16.5' },
  ]);
});

test('parseDependencyUpdates also accepts the raw `*` bullet form', () => {
  const body =
    '\n### Dependency Updates\n\n* `@stream-io/video-client` updated to version `9.9.9`\n';
  assert.deepEqual(parseDependencyUpdates(body), [
    { name: '@stream-io/video-client', version: '9.9.9' },
  ]);
});

test('parseOwnChanges collects Features and Bug Fixes bullets', () => {
  const entries = parseEntries(CLIENT_CL);
  const v1530 = entries.find((e) => e.version === '1.53.0')!;
  const own = parseOwnChanges(v1530.body);
  assert.equal(own.Features.length, 1);
  assert.match(own.Features[0], /Call event reporting/);
  assert.equal(own['Bug Fixes'].length, 1);
  assert.match(own['Bug Fixes'][0], /preserve captured stage error/);
});

test('parseOwnChanges captures loose pre-section bullets as "other"', () => {
  const entries = parseEntries(CLIENT_CL);
  const v1520 = entries.find((e) => e.version === '1.52.0')!;
  const own = parseOwnChanges(v1520.body);
  assert.equal(own.other.length, 1);
  assert.match(own.other[0], /upgrade React Native/);
  assert.equal(own.Features.length, 1);
});

test('parseOwnChanges ignores the Dependency Updates section (passthrough = empty)', () => {
  const top = parseEntries(BINDINGS_CL)[0];
  const own = parseOwnChanges(top.body);
  assert.equal(own.Features.length, 0);
  assert.equal(own['Bug Fixes'].length, 0);
  assert.equal(own.other.length, 0);
});

test('parseOwnChanges captures Chores and Refactors section bullets as "other"', () => {
  const body = [
    '### Features',
    '',
    '- a feature ([#1](https://x/issues/1))',
    '',
    '### Chores',
    '',
    '- a chore ([#2](https://x/issues/2))',
    '',
    '### Refactors',
    '',
    '- a refactor ([#3](https://x/issues/3))',
    '',
    '### Dependency Updates',
    '',
    '- `dep` updated to version `1.0.0`',
    '',
  ].join('\n');
  const own = parseOwnChanges(body);
  assert.deepEqual(own.Features, ['- a feature ([#1](https://x/issues/1))']);
  assert.ok(own.other.includes('- a chore ([#2](https://x/issues/2))'));
  assert.ok(own.other.includes('- a refactor ([#3](https://x/issues/3))'));
  assert.equal(own.other.length, 2);
});
