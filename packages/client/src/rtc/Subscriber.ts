import { StreamSfuClient } from '../StreamSfuClient';
import { getIceCandidate } from './helpers/iceCandidate';
import { PeerType } from '../gen/video/sfu/models/models';
import { SubscriberOffer } from '../gen/video/sfu/event/events';
import { Dispatcher } from './Dispatcher';
import { getLogger } from '../logger';

export type SubscriberOpts = {
  sfuClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack: (e: RTCTrackEvent) => void;
};

const logger = getLogger(['Subscriber']);

/**
 * A wrapper around the `RTCPeerConnection` that handles the incoming
 * media streams from the SFU.
 */
export class Subscriber {
  private pc: RTCPeerConnection;
  private readonly unregisterOnSubscriberOffer: () => void;
  private readonly onTrack: (e: RTCTrackEvent) => void;
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
    this.onTrack = onTrack;

    this.pc = this.createPeerConnection(connectionConfig);

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
   * Creates a new `RTCPeerConnection` instance with the given configuration.
   *
   * @param connectionConfig the connection configuration to use.
   */
  private createPeerConnection = (connectionConfig?: RTCConfiguration) => {
    const pc = new RTCPeerConnection(connectionConfig);
    pc.addEventListener('icecandidate', this.onIceCandidate);
    pc.addEventListener('track', this.onTrack);

    pc.addEventListener('icecandidateerror', this.onIceCandidateError);
    pc.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    pc.addEventListener(
      'icegatheringstatechange',
      this.onIceGatheringStateChange,
    );

    return pc;
  };

  /**
   * Closes the `RTCPeerConnection` and unsubscribes from the dispatcher.
   */
  close = () => {
    this.unregisterOnSubscriberOffer();
    this.pc.close();
  };

  /**
   * Returns the result of the `RTCPeerConnection.getStats()` method
   * @param selector
   * @returns
   */
  getStats = (selector?: MediaStreamTrack | null | undefined) => {
    return this.pc.getStats(selector);
  };

  /**
   * Migrates the subscriber to a new SFU client.
   *
   * @param sfuClient the new SFU client to migrate to.
   * @param connectionConfig the new connection configuration to use.
   */
  migrateTo = (
    sfuClient: StreamSfuClient,
    connectionConfig?: RTCConfiguration,
  ) => {
    this.sfuClient = sfuClient;

    // when migrating, we want to keep the previous subscriber open
    // until the new one is connected
    const previousPC = this.pc;
    const pc = this.createPeerConnection(connectionConfig);
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'connected') {
        previousPC.close();
      }
    });

    this.pc = pc;
  };

  private onIceCandidate = async (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      logger('warn', 'null ice candidate');
      return;
    }

    await this.sfuClient.iceTrickle({
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.SUBSCRIBER,
    });
  };

  private negotiate = async (subscriberOffer: SubscriberOffer) => {
    logger('info', `Received subscriberOffer`, subscriberOffer);

    await this.pc.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });

    this.sfuClient.iceTrickleBuffer.subscriberCandidates.subscribe(
      async (candidate) => {
        try {
          const iceCandidate = JSON.parse(candidate.iceCandidate);
          await this.pc.addIceCandidate(iceCandidate);
        } catch (e) {
          logger('error', `ICE candidate error`, [e, candidate]);
        }
      },
    );

    // apply ice candidates
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    await this.sfuClient.sendAnswer({
      peerType: PeerType.SUBSCRIBER,
      sdp: answer.sdp || '',
    });
  };

  private onIceConnectionStateChange = () => {
    logger('info', `ICE connection state changed`, this.pc.iceConnectionState);
  };

  private onIceGatheringStateChange = () => {
    logger('info', `ICE gathering state changed`, this.pc.iceGatheringState);
  };

  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    logger('error', `ICE Candidate error`, errorMessage);
  };
}
