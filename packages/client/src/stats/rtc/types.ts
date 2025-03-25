export type RTCStatsDataType =
  | RTCConfiguration
  | RTCIceCandidate
  | RTCSignalingState
  | RTCIceConnectionState
  | RTCIceGatheringState
  | RTCPeerConnectionState
  | [number | null | string] // RTCDataChannelEvent
  | string
  | RTCOfferOptions
  | [string | RTCDataChannelInit | undefined] // createDataChannel
  | (RTCOfferOptions | undefined) // createOffer | createAnswer
  | RTCSessionDescriptionInit
  | (RTCIceCandidateInit | RTCIceCandidate) // addIceCandidate
  | object
  | null
  | undefined;

export type Trace = (
  method: string,
  id: string | null,
  data: RTCStatsDataType,
) => void;
