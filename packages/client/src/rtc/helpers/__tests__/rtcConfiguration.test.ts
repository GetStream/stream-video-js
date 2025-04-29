import { describe, expect, it } from 'vitest';
import { ICEServer } from '../../../gen/coordinator';
import { toRtcConfiguration } from '../rtcConfiguration';

describe('rtcConfiguration', () => {
  it('should map ICEServer configuration to RTCConfiguration', () => {
    const config: ICEServer[] = [
      {
        urls: ['stun:stun.l.google.com:19302'],
        username: 'user',
        password: 'pass',
      },
      {
        urls: ['turn:turn.example.com'],
        username: 'user',
        password: 'pass',
      },
    ];
    expect(toRtcConfiguration(config)).toEqual({
      bundlePolicy: 'max-bundle',
      iceServers: [
        {
          urls: ['stun:stun.l.google.com:19302'],
          username: 'user',
          credential: 'pass',
        },
        {
          urls: ['turn:turn.example.com'],
          username: 'user',
          credential: 'pass',
        },
      ],
    });
  });
});
