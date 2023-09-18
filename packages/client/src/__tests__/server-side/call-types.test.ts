import 'dotenv/config';
import { beforeAll, describe, expect, it } from 'vitest';
import { StreamVideoServerClient } from '../../StreamVideoServerClient';
import { generateUUIDv4 } from '../../coordinator/connection/utils';
import { LogLevel } from '../../coordinator/connection/types';
import {
  OwnCapability,
  RecordSettingsModeEnum,
  RecordSettingsQualityEnum,
} from '../../gen/coordinator';

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
        screensharing: {
          access_request_enabled: false,
          enabled: true,
        },
        geofencing: {
          names: ['european_union'],
        },
      },
      notification_settings: {
        enabled: true,
        call_notification: {
          apns: {
            title: '{{ user.display_name }} invites you to a call',
          },
          enabled: true,
        },
        session_started: {
          enabled: false,
        },
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
    expect(createResponse.settings.geofencing.names).toEqual([
      'european_union',
    ]);
    expect(createResponse.settings.screensharing.access_request_enabled).toBe(
      false,
    );
    expect(createResponse.settings.screensharing.enabled).toBe(true);
    expect(createResponse.notification_settings.enabled).toBe(true);
    expect(createResponse.notification_settings.session_started.enabled).toBe(
      false,
    );
    expect(createResponse.notification_settings.call_notification.enabled).toBe(
      true,
    );
    expect(
      createResponse.notification_settings.call_notification.apns.title,
    ).toBe('{{ user.display_name }} invites you to a call');
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
          // FIXME OL: these props shouldn't be required to be set when recording is disabled
          audio_only: false,
          quality: RecordSettingsQualityEnum._1080P,
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
    try {
      await client.deleteCallType(callTypeName);
    } catch (e) {
      // the first request fails on backend sometimes
      // retry it
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 2000);
      });

      await client.deleteCallType(callTypeName);
    }

    await expect(() => client.getCallType(callTypeName)).rejects.toThrowError();
  });
});
