/**
 * Converts the ICE candidate to a JSON string.
 */
export const toJSON = (candidate: RTCIceCandidate) => {
  if (!candidate.usernameFragment) {
    // react-native-webrtc doesn't include usernameFragment in the candidate
    const usernameFragment = parseUfragFromCandidate(candidate.candidate);
    return JSON.stringify({ ...candidate, usernameFragment });
  }
  return JSON.stringify(candidate.toJSON());
};

/**
 * Extracts the ICE ufrag from an SDP, or `undefined` when absent.
 */
export const parseIceUfrag = (sdp: string | undefined): string | undefined => {
  return sdp?.match(/^a=ice-ufrag:(\S+)/m)?.[1];
};

/**
 * Extracts the ICE ufrag (generation) a trickled candidate was gathered under.
 */
export const getCandidateUfrag = (ice: RTCIceCandidateInit) => {
  return ice.usernameFragment ?? parseUfragFromCandidate(ice.candidate);
};

/**
 * Parses the `ufrag` token from a raw ICE candidate string
 * (e.g. `candidate:... ufrag <value> ...`). Returns `undefined` when absent.
 */
const parseUfragFromCandidate = (candidate: string | undefined) => {
  const segments = candidate?.split(' ') ?? [];
  const index = segments.indexOf('ufrag');
  return index !== -1 ? segments[index + 1] : undefined;
};
