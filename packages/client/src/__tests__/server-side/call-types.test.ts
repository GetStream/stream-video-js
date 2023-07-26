import 'dotenv/config';
import { beforeAll, describe, expect, it } from 'vitest';
import { StreamVideoServerClient } from '../../StreamVideoServerClient';
import { generateUUIDv4 } from '../../coordinator/connection/utils';
import { LogLevel } from '../../coordinator/connection/types';
import { OwnCapability, RecordSettingsModeEnum } from '../../gen/coordinator';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('call types CRUD API', () => {
  let client: StreamVideoServerClient;
  const callTypeName = `calltype${generateUUIDv4()}`;

  beforeAll(() => {
    client = new StreamVideoServerClient(apiKey, {
      secret,
      logLevel: 'trace',
      logger: (logLevel: LogLevel, message: string, ...args: unknown[]) => {
        console.log(new Date().toISOString(), message, ...args);
      },
    });
  });

  it('create', async () => {
    const createResponse = await client.createCallType({
      name: callTypeName,
      settings: {
        audio: { mic_default_on: true, default_device: 'speaker' },
      },
      grants: {
        admin: [
          OwnCapability.SEND_AUDIO,
          OwnCapability.SEND_VIDEO,
          OwnCapability.MUTE_USERS,
        ],
        user: [OwnCapability.SEND_AUDIO, OwnCapability.SEND_VIDEO],
      },
    });

    expect(createResponse.name).toBe(callTypeName);
    expect(createResponse.settings.audio.mic_default_on).toBe(true);
    expect(createResponse.settings.audio.default_device).toBe('speaker');
    expect(createResponse.grants.admin).toBeDefined();
    expect(createResponse.grants.user).toBeDefined();
  });

  it('read', async () => {
    const readResponse = await client.getCallTypes();

    expect(readResponse.call_types[callTypeName]).toContain({
      name: callTypeName,
    });
  });

  it('update', async () => {
    const updateResponse = await client.updateCallType(callTypeName, {
      settings: {
        audio: { mic_default_on: false, default_device: 'earpiece' },
        recording: {
          mode: RecordSettingsModeEnum.DISABLED,
        },
      },
    });

    expect(updateResponse.settings.audio.mic_default_on).toBeFalsy();
    expect(updateResponse.settings.audio.default_device).toBe('earpiece');
    expect(updateResponse.settings.recording.mode).toBe(
      RecordSettingsModeEnum.DISABLED,
    );
  });

  it('delete', async () => {
    await client.deleteCallType(callTypeName);

    await expect(() => client.getCallType(callTypeName)).rejects.toThrowError();
  });
});
