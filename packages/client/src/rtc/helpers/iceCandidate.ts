import { ICETrickle } from '../../gen/video/sfu/models/models';

export function getIceCandidate(
  candidate: RTCIceCandidate,
): ICETrickle['iceCandidate'] {
  if (!candidate.usernameFragment) {
    // react-native-webrtc doesn't include usernameFragment in the candidate
    const splittedCandidate = candidate.candidate.split(' ');
    const ufragIndex =
      splittedCandidate.findIndex((s: string) => s === 'ufrag') + 1;
    const usernameFragment = splittedCandidate[ufragIndex];
    return JSON.stringify({ ...candidate, usernameFragment });
  } else {
    return JSON.stringify(candidate.toJSON());
  }
}
