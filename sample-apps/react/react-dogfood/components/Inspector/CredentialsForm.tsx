import {
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import type { Credentials } from './types';
import { meetingId } from '../../lib/idGenerators';
import { nanoid } from 'nanoid';
import clsx from 'clsx';

const placeholderCallId = meetingId();
const placeholderApiKey = nanoid(12);
const placeholderUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhpcyBpcyBub3QgYSByZWFsIHVzZXIifQ.JS3uVt1Z8qAOmynWu1c2YOzcDFFoalD0jC3sqkGTv0c';

export function CredentialsForm(props: {
  defaultValue: Credentials;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit: (value: Credentials) => void;
}) {
  const [invalid, setInvalid] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const callType = data.get('callType')?.toString() ?? '';
    const callId = data.get('callId')?.toString() ?? '';
    const apiKey = data.get('apiKey')?.toString() ?? '';
    const userToken = data.get('userToken')?.toString() ?? '';

    if (!callType || !callId || !apiKey || !userToken) {
      setInvalid(true);
      return;
    }

    let userId: string;
    try {
      userId = parseUserIdFromToken(userToken);
    } catch {
      setInvalid(true);
      return;
    }

    props.onSubmit({ callType, callId, apiKey, userToken, userId });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const maybeConnectionString = event.clipboardData.getData('text');

    try {
      const credentials = parseConnectionString(maybeConnectionString);
      event.preventDefault();
      const form = event.currentTarget.form!;
      (['callType', 'callId', 'apiKey', 'userToken'] as const).forEach(
        (key) => {
          form.querySelector<HTMLInputElement>(`input[name=${key}]`)!.value =
            credentials[key];
        },
      );
    } catch {}
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={clsx({
          'rd__connection-string-input': true,
          'rd__connection-string-input_invalid': invalid,
        })}
        onAnimationEnd={() => setInvalid(false)}
      >
        <input
          name="callType"
          defaultValue={props.defaultValue.callType}
          disabled={props.disabled}
          placeholder="call type: default"
          autoFocus={props.autoFocus}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />
        <input
          name="callId"
          defaultValue={props.defaultValue.callId}
          disabled={props.disabled}
          placeholder={`call id: ${placeholderCallId}`}
          onKeyDown={handleKeyDown}
        />
        <input
          name="apiKey"
          defaultValue={props.defaultValue.apiKey}
          disabled={props.disabled}
          placeholder={`key: ${placeholderApiKey}`}
          onKeyDown={handleKeyDown}
        />
        <input
          name="userToken"
          defaultValue={props.defaultValue.userToken}
          disabled={props.disabled}
          placeholder={`token: ${placeholderUserToken}`}
          onKeyDown={handleKeyDown}
        />
      </div>
    </form>
  );
}

export function parseConnectionString(connectionString: string): Credentials {
  // Example connection lines:
  // callType:callId@apiKey:userToken
  // callId@apiKey:userToken (default call type)
  const connectionStringRegex =
    /^((?<callType>[\w-]+):)?(?<callId>[\w-]+)@(?<apiKey>[a-z0-9]+):(?<userToken>[\w-.]+)$/i;
  const matches = connectionString.match(connectionStringRegex);

  if (!matches || !matches.groups) {
    throw new Error('Cannot parse connection string');
  }

  return {
    callType: matches.groups['callType'] ?? 'default',
    callId: matches.groups['callId'],
    apiKey: matches.groups['apiKey'],
    userId: parseUserIdFromToken(matches.groups['userToken']),
    userToken: matches.groups['userToken'],
  };
}

function parseUserIdFromToken(userToken: string) {
  const payload = userToken.split('.')[1];
  if (!payload) return '';
  return JSON.parse(atob(payload)).user_id ?? '';
}
