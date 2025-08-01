import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  10,
);

export function meetingId(length = 21) {
  return nanoid(length);
}

export function userId(length = 21) {
  return nanoid(length);
}

export function inspectorUserId(length = 8) {
  return `inspector-${nanoid(length)}`;
}
