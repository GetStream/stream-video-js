import { describe, expect, it } from 'vitest';
import { getCandidateUfrag, parseIceUfrag, toJSON } from '../iceCandiates';

describe('iceCandiates helpers', () => {
  describe('toJSON', () => {
    it('parses the ufrag from the candidate string when usernameFragment is missing (react-native-webrtc)', () => {
      const candidate = {
        candidate:
          'candidate:1 1 udp 100 1.2.3.4 5000 typ host ufrag ABC network-id 1',
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = JSON.parse(toJSON(candidate));
      expect(result.usernameFragment).toBe('ABC');
      expect(result.sdpMid).toBe('0');
    });

    it('leaves usernameFragment undefined when it is missing and the candidate has no ufrag token', () => {
      const candidate = {
        candidate: 'candidate:1 1 udp 100 1.2.3.4 5000 typ host generation 0',
      } as unknown as RTCIceCandidate;

      const result = JSON.parse(toJSON(candidate));
      expect(result.usernameFragment).toBeUndefined();
    });
  });

  describe('parseIceUfrag', () => {
    it('extracts the ice-ufrag from an SDP', () => {
      const sdp = 'v=0\r\na=ice-ufrag:F7gIaBcD\r\na=ice-pwd:somepwd\r\n';
      expect(parseIceUfrag(sdp)).toBe('F7gIaBcD');
    });

    it('returns undefined when the SDP has no ice-ufrag', () => {
      expect(parseIceUfrag('v=0\r\na=ice-pwd:somepwd\r\n')).toBeUndefined();
    });

    it('returns undefined for an undefined SDP', () => {
      expect(parseIceUfrag(undefined)).toBeUndefined();
    });
  });

  describe('getCandidateUfrag', () => {
    it('uses usernameFragment when present', () => {
      expect(
        getCandidateUfrag({
          candidate: 'candidate:1 1 udp 100 1.2.3.4 5000 typ host',
          usernameFragment: 'DEF',
        }),
      ).toBe('DEF');
    });

    it('prefers usernameFragment over the candidate-string ufrag token', () => {
      expect(
        getCandidateUfrag({
          candidate: 'candidate:1 1 udp 100 1.2.3.4 5000 typ host ufrag ABC',
          usernameFragment: 'DEF',
        }),
      ).toBe('DEF');
    });

    it('falls back to the ufrag token in the candidate string when usernameFragment is absent', () => {
      expect(
        getCandidateUfrag({
          candidate:
            'candidate:1 1 udp 100 1.2.3.4 5000 typ host ufrag ABC network-id 1',
        }),
      ).toBe('ABC');
    });

    it('reads the ufrag from a realistic SFU trickled candidate string', () => {
      // The SFU embeds the generation as a `ufrag` token in the candidate
      // string, so the consumer can classify it without a usernameFragment.
      const candidate =
        'candidate:842163049 1 udp 1677729535 203.0.113.1 56789 typ srflx raddr 0.0.0.0 rport 0 generation 0 ufrag F7gIaBcD network-id 1 network-cost 10';
      expect(getCandidateUfrag({ candidate })).toBe('F7gIaBcD');
    });

    it('returns undefined when neither a usernameFragment nor a ufrag token is present', () => {
      expect(
        getCandidateUfrag({
          candidate: 'candidate:1 1 udp 100 1.2.3.4 5000 typ host',
        }),
      ).toBeUndefined();
      expect(getCandidateUfrag({})).toBeUndefined();
    });
  });
});
