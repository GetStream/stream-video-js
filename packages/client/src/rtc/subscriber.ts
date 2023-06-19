import { StreamSfuClient } from '../StreamSfuClient';
import { getIceCandidate } from './helpers/iceCandidate';
import { PeerType } from '../gen/video/sfu/models/models';
import { Dispatcher } from './Dispatcher';
import { getLogger } from '../logger';

export type SubscriberOpts = {
  sfuClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack?: (e: RTCTrackEvent) => void;
};

export const createSubscriber = ({
  sfuClient,
  dispatcher,
  connectionConfig,
  onTrack,
}: SubscriberOpts) => {
  const logger = getLogger(['sfu-client']);
  const subscriber = new RTCPeerConnection(connectionConfig);
  attachDebugEventListeners(subscriber);

  subscriber.addEventListener('icecandidate', async (e) => {
    const { candidate } = e;
    if (!candidate) {
      logger?.('warn', 'null ice candidate');
      return;
    }

    await sfuClient.iceTrickle({
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.SUBSCRIBER,
    });
  });

  if (onTrack) {
    subscriber.addEventListener('track', onTrack);
  }

  const { iceTrickleBuffer } = sfuClient;
  const unsubscribe = dispatcher.on('subscriberOffer', async (message) => {
    if (message.eventPayload.oneofKind !== 'subscriberOffer') return;
    const { subscriberOffer } = message.eventPayload;
    logger?.('info', 'Received subscriberOffer', subscriberOffer);

    await subscriber.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });

    iceTrickleBuffer.subscriberCandidates.subscribe(async (candidate) => {
      try {
        const iceCandidate = JSON.parse(candidate.iceCandidate);
        await subscriber.addIceCandidate(iceCandidate);
      } catch (e) {
        logger?.('error', `Subscriber: ICE candidate error`, {
          error: e,
          candidate,
        });
      }
    });

    // apply ice candidates
    const answer = await subscriber.createAnswer();
    await subscriber.setLocalDescription(answer);

    await sfuClient.sendAnswer({
      peerType: PeerType.SUBSCRIBER,
      sdp: answer.sdp || '',
    });
  });

  // we replace the close method of the subscriber PeerConnection
  // so that we can preform some cleanups before closing the connection.
  // We are doing this as currently there is no event that is fired
  // when the subscriber PeerConnection is closed.
  const originalClose = subscriber.close;
  subscriber.close = () => {
    unsubscribe();
    originalClose.call(subscriber);
  };

  return subscriber;
};

const attachDebugEventListeners = (subscriber: RTCPeerConnection) => {
  const logger = getLogger(['sfu-client']);
  subscriber.addEventListener('icecandidateerror', (e) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    logger?.('error', `Subscriber: ICE Candidate error: ${errorMessage}`);
  });
  subscriber.addEventListener('iceconnectionstatechange', () => {
    logger?.(
      'info',
      `Subscriber: ICE Connection state changed: ${subscriber.iceConnectionState}`,
    );
  });
  subscriber.addEventListener('icegatheringstatechange', () => {
    logger?.(
      'info',
      `Subscriber: ICE Gathering State: ${subscriber.iceGatheringState}`,
    );
  });
};
