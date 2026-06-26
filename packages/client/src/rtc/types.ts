import {
  AudioBitrateProfile,
  PeerType,
  PublishOption,
  TrackType,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';
import { CallState } from '../store';
import { Dispatcher } from './Dispatcher';
import type { OptimalVideoLayer } from './layers';
import type { ClientPublishOptions } from '../types';
import type { VideoSender } from '../gen/video/sfu/event/events';

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
  /** Subscriber renegotiation kept failing, escalate to REJOIN. */
  SUBSCRIBER_NEGOTIATION_FAILED: 'subscriber_negotiation_failed',
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

/**
 * Fires the first time a peer connection's ICE transport reaches
 * `connected` or `completed` during its lifetime. Used by `Call` to reset
 * the "ICE never connected" failure counter only when WebRTC has actually
 * recovered, not merely when the SFU join handshake succeeded.
 */
export type OnIceConnected = (peerType: PeerType) => void;

/**
 * Snapshot of the peer connection's ICE and DTLS state surfaced to telemetry
 * consumers (e.g. `ClientEventReporter`). Fired on every transition of
 * either `iceConnectionState` or `peerConnectionState`.
 */
export type PeerConnectionStateChangeEvent =
  | {
      peerType: PeerType;
      stateType: 'ice';
      state: RTCIceConnectionState;
    }
  | {
      peerType: PeerType;
      stateType: 'peerConnection';
      state: RTCPeerConnectionState;
    };

export type OnPeerConnectionStateChange = (
  event: PeerConnectionStateChangeEvent,
) => void;

/**
 * Fired when a remote track starts receiving media (`unmute`). Used by
 * telemetry to report the `FirstVideoFrame` / `FirstAudioFrame` stage; the
 * consumer decides which track types are relevant.
 */
export type OnRemoteTrackUnmute = (
  trackType: TrackType,
  trackId: string,
) => void;

export type BasePeerConnectionOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
  onReconnectionNeeded?: OnReconnectionNeeded;
  onIceConnected?: OnIceConnected;
  onPeerConnectionStateChange?: OnPeerConnectionStateChange;
  onRemoteTrackUnmute?: OnRemoteTrackUnmute;
  tag: string;
  enableTracing: boolean;
  iceRestartDelay?: number;
  clientPublishOptions?: ClientPublishOptions;
  statsTimestampDriftThresholdMs?: number;
};

export type TrackPublishOptions = {
  audioBitrateProfile?: AudioBitrateProfile;
};

export type PublishBundle = {
  publishOption: PublishOption;
  transceiver: RTCRtpTransceiver;
  options: TrackPublishOptions;
  videoSender?: VideoSender;
};

export type TrackLayersCache = {
  publishOption: PublishOption;
  layers: OptimalVideoLayer[];
};
