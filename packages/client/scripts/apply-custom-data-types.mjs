/**
 * Rewrites the `custom: Record<string, any>` fields of the generated
 * coordinator models to the augmentable interfaces of `src/custom_types.ts`.
 *
 * `generate-openapi.sh` runs it on the generator output, before `lint:gen`.
 *
 * Usage: node scripts/apply-custom-data-types.mjs <path-to-models/index.ts>
 */
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * `Interface` → the type of its `custom` field, or
 * `Interface.filterField` → the type of the `custom` entry of its filter.
 */
const MAPPING = {
  CallRequest: 'CustomCallData',
  CallResponse: 'CustomCallData',
  UpdateCallRequest: 'CustomCallData',
  'QueryCallsRequest.filter_conditions': 'CustomCallData',

  MemberRequest: 'CustomMemberData',
  MemberResponse: 'CustomMemberData',
  'QueryCallMembersRequest.filter_conditions': 'CustomMemberData',

  OwnUserResponse: 'CustomUserData',
  UserResponse: 'CustomUserData',
  UserResponseCommonFields: 'CustomUserData',
  UserResponsePrivacyFields: 'CustomUserData',

  SendVideoReactionRequest: 'CustomReactionData',
  VideoReactionResponse: 'CustomReactionData',

  CustomVideoEvent: 'CustomEventData',
  SendCallEventRequest: 'CustomEventData',
};

/**
 * Interfaces whose `custom` field intentionally stays `Record<string, any>`:
 * the envelope of WS events, the user feedback, the opaque ring context.
 */
const UNTYPED = new Set([
  'AppUpdatedEvent',
  'CallModerationBlurEvent',
  'CallModerationWarningEvent',
  'CallUserFeedbackSubmittedEvent',
  'CollectUserFeedbackRequest',
  'HealthCheckEvent',
  'RingCallRequest',
  'UserBannedEvent',
  'UserDeactivatedEvent',
  'UserDeletedEvent',
  'UserPresenceChangedEvent',
  'UserReactivatedEvent',
  'UserUnbannedEvent',
  'UserUpdatedEvent',
]);

const IMPORT_SPECIFIER = '../../../custom_types';

const file = process.argv[2];
const source = readFileSync(file, 'utf8');
if (source.includes(IMPORT_SPECIFIER)) {
  console.log(`Custom data types are already applied to ${file}`);
  process.exit(0);
}

const applied = new Set();
const unknown = new Set();
let currentInterface = '';
let filterField = '';
let previousLine = '';

const lines = source.split('\n').map((line) => {
  const [, interfaceName] = line.match(/^export interface (\w+)/) ?? [];
  if (interfaceName) {
    currentInterface = interfaceName;
    filterField = '';
  }

  const [, filterName] = line.match(/^\s*(\w+)\??: Filters<\{$/) ?? [];
  if (filterName) filterField = filterName;

  const isField = /^\s*custom\??: Record<string, any>;?$/.test(line);
  const isFilterEntry =
    /^\s*"?custom"?: \{$/.test(previousLine) &&
    /^\s*type: Record<string, any>;?$/.test(line);
  previousLine = line;
  if (!isField && !isFilterEntry) return line;

  const key = isField ? currentInterface : `${currentInterface}.${filterField}`;
  const type = MAPPING[key];
  if (!type) {
    if (!UNTYPED.has(key)) unknown.add(key);
    return line;
  }
  applied.add(key);
  return line.replace('Record<string, any>', type);
});

const missed = Object.keys(MAPPING).filter((key) => !applied.has(key));
if (unknown.size > 0 || missed.length > 0) {
  console.error(
    [
      ...[...unknown].map((key) => `${key}: add it to MAPPING or UNTYPED`),
      ...missed.map((key) => `${key}: in MAPPING, but not found in ${file}`),
    ].join('\n'),
  );
  process.exit(1);
}

const types = [...new Set(Object.values(MAPPING))].sort().join(', ');
const importStatement = `import type { ${types} } from '${IMPORT_SPECIFIER}';`;

writeFileSync(file, `${importStatement}\n${lines.join('\n')}`);
console.log(`Applied ${applied.size} custom data types to ${file}`);
