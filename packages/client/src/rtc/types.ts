import {
  AudioBitrateProfile,
  PublishOption,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';
import { CallState } from '../store';
import { Dispatcher } from './Dispatcher';
import type { OptimalVideoLayer } from './layers';

export type OnReconnectionNeeded = (
  kind: WebsocketReconnectStrategy,
  reason: string,
) => void;

export type BasePeerConnectionOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
  onReconnectionNeeded?: OnReconnectionNeeded;
  tag: string;
  enableTracing: boolean;
  iceRestartDelay?: number;
};

export type PublisherConstructorOpts = BasePeerConnectionOpts & {
  publishOptions: PublishOption[];
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
