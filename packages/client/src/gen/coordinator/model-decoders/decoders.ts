const DATETIME_FIELDS = new Set<string>([
  'archived_at',
  'ban_expires',
  'call_ended_at',
  'call_started_at',
  'captured_at',
  'created_at',
  'deactivated_at',
  'deleted_at',
  'disabled_until',
  'end_at',
  'end_time',
  'ended_at',
  'expiration',
  'expires',
  'first_reaction_at',
  'first_stats_time',
  'generated_at',
  'hide_messages_before',
  'invite_accepted_at',
  'invite_rejected_at',
  'joined_at',
  'last_active',
  'last_message_at',
  'last_reaction_at',
  'latest_activity_at',
  'left_at',
  'live_ended_at',
  'live_started_at',
  'message_text_updated_at',
  'mute_expires_at',
  'pin_expires',
  'pinned_at',
  'previously_connected_timestamp',
  'received_at',
  'remind_at',
  'revoke_tokens_issued_before',
  'since',
  'start_time',
  'start_ts',
  'started_at',
  'starts_at',
  'time',
  'timer_ends_at',
  'timestamp',
  'truncated_at',
  'until',
  'updated_at',
]);
const DATETIME_MAP_FIELDS = new Set<string>([
  'accepted_by',
  'missed_by',
  'rejected_by',
]);
const OPAQUE_FIELDS = new Set<string>([
  'channel_custom',
  'custom',
  'data',
  'payload',
]);

type SchemaField = readonly ['array' | 'map' | 'object', string];

const COLLISIONS = {
  CallLevelEventPayload: ['timestamp'],
} as Record<string, readonly string[]>;

const OPAQUE_BY_SCHEMA = {} as Record<string, readonly string[]>;

const SCHEMA_FIELDS = {
  QueryCallSessionParticipantStatsResponse: {
    call_events: ['array', 'CallLevelEventPayload'],
  },
} as Record<string, Record<string, SchemaField>>;

const hasOwn = (obj: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const isCollision = (
  schemaName: string | undefined,
  fieldName: string,
): boolean => {
  if (!schemaName || !hasOwn(COLLISIONS, schemaName)) return false;

  return COLLISIONS[schemaName].includes(fieldName);
};

const isOpaque = (
  schemaName: string | undefined,
  fieldName: string,
): boolean => {
  if (OPAQUE_FIELDS.has(fieldName)) return true;
  if (!schemaName || !hasOwn(OPAQUE_BY_SCHEMA, schemaName)) return false;

  return OPAQUE_BY_SCHEMA[schemaName].includes(fieldName);
};

const decodeDatetimeType = (input: number | string): string =>
  typeof input === 'string'
    ? input
    : new Date(Math.floor(input / 1_000_000)).toISOString();

const decodeDatetimeMap = (input: unknown): void => {
  if (!input || typeof input !== 'object') return;

  const object = input as Record<string, unknown>;
  for (const key of Object.keys(object)) {
    const value = object[key];
    if (typeof value === 'number') object[key] = decodeDatetimeType(value);
  }
};

const getChildSchemaField = (
  schemaName: string | undefined,
  fieldName: string,
): SchemaField | undefined => {
  if (!schemaName || !hasOwn(SCHEMA_FIELDS, schemaName)) return undefined;

  return SCHEMA_FIELDS[schemaName][fieldName];
};

const decodeChildSchema = (input: unknown, field: SchemaField): void => {
  const [kind, schemaName] = field;

  if (kind === 'array') {
    if (!Array.isArray(input)) return;
    for (const item of input) decodeDatetimes(item, schemaName);
    return;
  }

  if (kind === 'map') {
    if (!input || typeof input !== 'object') return;
    const object = input as Record<string, unknown>;
    for (const key of Object.keys(object))
      decodeDatetimes(object[key], schemaName);
    return;
  }

  decodeDatetimes(input, schemaName);
};

function decodeDatetimes(input: unknown, schemaName?: string): unknown {
  if (Array.isArray(input)) {
    for (const item of input) decodeDatetimes(item, schemaName);
    return input;
  }

  if (!input || typeof input !== 'object') return input;

  const object = input as Record<string, unknown>;

  for (const key of Object.keys(object)) {
    if (isOpaque(schemaName, key)) continue;

    const value = object[key];

    if (
      DATETIME_FIELDS.has(key) &&
      !isCollision(schemaName, key) &&
      typeof value === 'number'
    ) {
      object[key] = decodeDatetimeType(value);
      continue;
    }

    if (DATETIME_MAP_FIELDS.has(key)) {
      decodeDatetimeMap(value);
      continue;
    }

    const childSchema = getChildSchemaField(schemaName, key);
    if (childSchema) {
      decodeChildSchema(value, childSchema);
      continue;
    }

    decodeDatetimes(value);
  }

  return input;
}

const decoderCache: Record<string, (input: any) => any> = {};

export const decoders: Record<string, (input: any) => any> = new Proxy(
  {} as Record<string, (input: any) => any>,
  {
    get: (_, schemaName) => {
      const key = String(schemaName);
      return (decoderCache[key] ??= (value: any) =>
        decodeDatetimes(value, key));
    },
  },
);
