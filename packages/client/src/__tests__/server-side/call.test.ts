import 'dotenv/config';
import { beforeAll, describe, expect, it } from 'vitest';
import { StreamVideoServerClient } from '../../StreamVideoServerClient';
import { generateUUIDv4 } from '../../coordinator/connection/utils';
import { Call } from '../../Call';
import {
  RecordSettingsRequestModeEnum,
  RecordSettingsRequestQualityEnum,
} from '../../gen/coordinator';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('call API', () => {
  let client: StreamVideoServerClient;
  const callId = `call${generateUUIDv4()}`;
  let call: Call;

  beforeAll(() => {
    client = new StreamVideoServerClient(apiKey, {
      secret,
      logLevel: 'error',
    });

    call = client.call('default', callId);
  });

  it('create', async () => {
    const response = await call.create({
      data: {
        created_by_id: 'john',
        settings_override: {
          geofencing: {
            names: ['canada'],
          },
          screensharing: {
            enabled: false,
          },
        },
      },
    });

    expect(response.call.created_by.id).toBe('john');
    expect(response.call.settings.geofencing.names).toEqual(['canada']);
    expect(response.call.settings.screensharing.enabled).toBe(false);
  });

  it('update', async () => {
    const response = await call.update({
      settings_override: {
        audio: { mic_default_on: true, default_device: 'speaker' },
      },
      custom: { color: 'red' },
    });

    expect(response.call.settings.audio.mic_default_on).toBe(true);
    expect(response.call.custom.color).toBe('red');
  });

  it('RTMP address', async () => {
    const resp = await call.getOrCreate();
    const address = resp.call.ingress.rtmp.address;

    expect(address).toBeDefined();
  });

  it('query calls', async () => {
    let response = await client.queryCalls();

    let calls = response.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);

    const queryCallsReq = {
      sort: [{ field: 'starts_at', direction: -1 }],
      limit: 2,
    };
    response = await client.queryCalls(queryCallsReq);

    calls = response.calls;
    expect(calls.length).toBe(2);

    response = await client.queryCalls({
      ...queryCallsReq,
      next: response.next,
    });

    expect(response.calls.length).toBeLessThanOrEqual(2);

    response = await client.queryCalls({
      filter_conditions: { backstage: { $eq: false } },
    });

    expect(response.calls.length).toBeGreaterThanOrEqual(1);
  });

  describe('recording', () => {
    it('enable call recording', async () => {
      let response = await call.update({
        settings_override: {
          recording: {
            mode: RecordSettingsRequestModeEnum.DISABLED,
          },
        },
      });
      let settings = response.call.settings.recording;

      expect(settings.mode).toBe(RecordSettingsRequestModeEnum.DISABLED);

      response = await call.update({
        settings_override: {
          recording: {
            mode: RecordSettingsRequestModeEnum.AVAILABLE,
          },
        },
      });

      settings = response.call.settings.recording;
      expect(settings.mode).toBe(RecordSettingsRequestModeEnum.AVAILABLE);

      response = await call.update({
        settings_override: {
          recording: {
            mode: RecordSettingsRequestModeEnum.AVAILABLE,
            audio_only: false,
            quality: RecordSettingsRequestQualityEnum._1080P,
          },
        },
      });

      settings = response.call.settings.recording;
      expect(settings.audio_only).toBe(false);
      expect(settings.quality).toBe(RecordSettingsRequestQualityEnum._1080P);
    });

    it('start recording', async () => {
      // somewhat dummy test, we should do a proper test in the future where we join a call and start recording
      await expect(() => call.startRecording()).rejects.toThrowError(
        'Stream error code 4: StartRecording failed with error: "cannot record inactive call"',
      );
    });

    it('stop recording', async () => {
      // somewhat dummy test, we should do a proper test in the future
      await expect(() => call.stopRecording()).rejects.toThrowError(
        'Stream error code 4: StopRecording failed with error: "call is not being recorded"',
      );
    });

    it('query recordings', async () => {
      // somewhat dummy test, we should do a proper test in the future
      let response = await call.queryRecordings();

      expect(response.recordings).toBeDefined();

      response = await call.queryRecordings('session123');

      expect(response.recordings).toBeDefined();
    });
  });
});
