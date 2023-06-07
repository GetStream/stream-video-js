import { StreamSfuClient } from '../StreamSfuClient';
import { getIceCandidate } from './helpers/iceCandidate';
import { PeerType } from '../gen/video/sfu/models/models';
import { SubscriberOffer } from '../gen/video/sfu/event/events';
import { Dispatcher } from './Dispatcher';

export type SubscriberOpts = {
  sfuClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack: (e: RTCTrackEvent) => void;
};

/**
 * A wrapper around the `RTCPeerConnection` that handles the incoming
 * media streams from the SFU.
 */
export class Subscriber {
  private readonly subscriber: RTCPeerConnection;
  private readonly unregisterOnSubscriberOffer: () => void;
  private sfuClient: StreamSfuClient;
  private dispatcher: Dispatcher;

  /**
   * Constructs a new `Subscriber` instance.
   *
   * @param sfuClient the SFU client to use.
   * @param dispatcher the dispatcher to use.
   * @param connectionConfig the connection configuration to use.
   * @param onTrack the callback to call when a new track is received.
   */
  constructor({
    sfuClient,
    dispatcher,
    connectionConfig,
    onTrack,
  }: SubscriberOpts) {
    this.sfuClient = sfuClient;
    this.dispatcher = dispatcher;

    const pc = new RTCPeerConnection(connectionConfig);
    pc.addEventListener('icecandidate', this.onIceCandidate);
    pc.addEventListener('track', onTrack);
    attachDebugEventListeners(pc);

    this.subscriber = pc;

    this.unregisterOnSubscriberOffer = dispatcher.on(
      'subscriberOffer',
      async (message) => {
        if (message.eventPayload.oneofKind !== 'subscriberOffer') return;
        const { subscriberOffer } = message.eventPayload;
        await this.negotiate(subscriberOffer);
      },
    );
  }

  /**
   * Closes the `RTCPeerConnection` and unsubscribes from the dispatcher.
   */
  close = () => {
    this.unregisterOnSubscriberOffer();
    this.subscriber.close();
  };

  /**
   * Returns the result of the `RTCPeerConnection.getStats()` method
   * @param selector
   * @returns
   */
  getStats(selector?: MediaStreamTrack | null | undefined) {
    return this.subscriber.getStats(selector);
  }

  /**
   * Migrates the subscriber to a new SFU client.
   *
   * @param sfuClient the new SFU client to migrate to.
   */
  migrateTo = (sfuClient: StreamSfuClient) => {
    this.sfuClient = sfuClient;
  };

  private onIceCandidate = async (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }

    await this.sfuClient.iceTrickle({
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.SUBSCRIBER,
    });
  };

  private negotiate = async (subscriberOffer: SubscriberOffer) => {
    console.log(`Received subscriberOffer`, subscriberOffer);

    await this.subscriber.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });

    this.sfuClient.iceTrickleBuffer.subscriberCandidates.subscribe(
      async (candidate) => {
        try {
          const iceCandidate = JSON.parse(candidate.iceCandidate);
          await this.subscriber.addIceCandidate(iceCandidate);
        } catch (e) {
          console.error(`Subscriber: ICE candidate error`, e, candidate);
        }
      },
    );

    // apply ice candidates
    const answer = await this.subscriber.createAnswer();
    await this.subscriber.setLocalDescription(answer);

    await this.sfuClient.sendAnswer({
      peerType: PeerType.SUBSCRIBER,
      sdp: answer.sdp || '',
    });
  };
}

const attachDebugEventListeners = (subscriber: RTCPeerConnection) => {
  subscriber.addEventListener('icecandidateerror', (e) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    console.error(`Subscriber: ICE Candidate error`, errorMessage);
  });
  subscriber.addEventListener('iceconnectionstatechange', () => {
    console.log(
      `Subscriber: ICE Connection state changed`,
      subscriber.iceConnectionState,
    );
  });
  subscriber.addEventListener('icegatheringstatechange', () => {
    console.log(
      `Subscriber: ICE Gathering State`,
      subscriber.iceGatheringState,
    );
  });
};
