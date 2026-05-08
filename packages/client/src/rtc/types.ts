import {
  AudioBitrateProfile,
  PeerType,
  PublishOption,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';
import { CallState } from '../store';
import { Dispatcher } from './Dispatcher';
import type { OptimalVideoLayer } from './layers';
import type { ClientPublishOptions } from '../types';

/**
 * Canonical reasons the SDK uses to trigger a reconnection. Free-form strings
 * are still accepted at the callback boundary (e.g. when forwarding an SFU
 * error message), but only the members below influence reconnect-loop
 * behavior. In particular, `Call.reconnect` programmatically inspects
 * `ICE_NEVER_CONNECTED` to drive the unsupported-network detector — pass a
 * canonical member when you want the SDK to react to the reason; pass a
 * free-form string when the value is purely diagnostic.
 */
export const ReconnectReason = {
  /** ICE never reached `connected`/`completed`, escalate to REJOIN. */
  ICE_NEVER_CONNECTED: 'ice_never_connected',
  /** RTCPeerConnection.connectionState became `failed`. */
  CONNECTION_FAILED: 'connection_failed',
  /** `restartIce()` rejected. */
  RESTART_ICE_FAILED: 'restart_ice_failed',
  /** SFU `goAway` event, migrate to a new SFU. */
  GO_AWAY: 'go_away',
  /** Network came back online after going offline. */
  NETWORK_BACK_ONLINE: 'network_back_online',
  /** SFU error event with no descriptive message. */
  SFU_ERROR: 'sfu_error',
} as const;

export type ReconnectReason =
  | (typeof ReconnectReason)[keyof typeof ReconnectReason]
  | (string & {});

export type OnReconnectionNeeded = (
  kind: WebsocketReconnectStrategy,
  reason: ReconnectReason,
  peerType: PeerType,
) => void;

export type RemoteAudioTrackChange = 'muted' | 'unmuted' | 'ended';

export type OnRemoteAudioTrackChange = (
  track: MediaStreamTrack,
  change: RemoteAudioTrackChange,
) => void;

/**
 * Fires the first time a peer connection's ICE transport reaches
 * `connected` or `completed` during its lifetime. Used by `Call` to reset
 * the "ICE never connected" failure counter only when WebRTC has actually
 * recovered, not merely when the SFU join handshake succeeded.
 */
export type OnIceConnected = (peerType: PeerType) => void;

export type BasePeerConnectionOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
  onReconnectionNeeded?: OnReconnectionNeeded;
  onRemoteAudioTrackChange: OnRemoteAudioTrackChange;
  onIceConnected?: OnIceConnected;
  tag: string;
  enableTracing: boolean;
  iceRestartDelay?: number;
  clientPublishOptions?: ClientPublishOptions;
};

export type TrackPublishOptions = {
  audioBitrateProfile?: AudioBitrateProfile;
};

export type PublishBundle = {
  publishOption: PublishOption;
  transceiver: RTCRtpTransceiver;
  options: TrackPublishOptions;
};

export type TrackLayersCache = {
  publishOption: PublishOption;
  layers: OptimalVideoLayer[];
};
