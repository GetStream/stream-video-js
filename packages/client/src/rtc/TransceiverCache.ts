import { PublishOption } from '../gen/video/sfu/models/models';
import { OptimalVideoLayer } from './videoLayers';

type TransceiverId = {
  publishOption: PublishOption;
  transceiver: RTCRtpTransceiver;
};
type TrackLayersCache = {
  publishOption: PublishOption;
  layers: OptimalVideoLayer[];
};

export class TransceiverCache {
  private readonly cache: TransceiverId[] = [];
  private readonly layers: TrackLayersCache[] = [];

  /**
   * An array maintaining the order how transceivers were added to the peer connection.
   * This is needed because some browsers (Firefox) don't reliably report
   * trackId and `mid` parameters.
   */
  private readonly transceiverOrder: RTCRtpTransceiver[] = [];

  /**
   * Adds a transceiver to the cache.
   */
  add = (publishOption: PublishOption, transceiver: RTCRtpTransceiver) => {
    this.cache.push({ publishOption, transceiver });
    this.transceiverOrder.push(transceiver);
  };

  /**
   * Gets the transceiver for the given publish option.
   */
  get = (publishOption: PublishOption): RTCRtpTransceiver | undefined => {
    return this.findTransceiver(publishOption)?.transceiver;
  };

  /**
   * Checks if the cache has the given publish option.
   */
  has = (publishOption: PublishOption): boolean => {
    return !!this.get(publishOption);
  };

  /**
   * Finds the first transceiver that satisfies the given predicate.
   */
  find = (
    predicate: (item: TransceiverId) => boolean,
  ): TransceiverId | undefined => {
    return this.cache.find(predicate);
  };

  /**
   * Provides all the items in the cache.
   */
  items = (): TransceiverId[] => {
    return this.cache;
  };

  /**
   * Init index of the transceiver in the cache.
   */
  indexOf = (transceiver: RTCRtpTransceiver): number => {
    return this.transceiverOrder.indexOf(transceiver);
  };

  /**
   * Gets cached video layers for the given track.
   */
  getLayers = (
    publishOption: PublishOption,
  ): OptimalVideoLayer[] | undefined => {
    const entry = this.layers.find(
      (item) =>
        item.publishOption.id === publishOption.id &&
        item.publishOption.trackType === publishOption.trackType,
    );
    return entry?.layers;
  };

  /**
   * Sets the video layers for the given track.
   */
  setLayers = (
    publishOption: PublishOption,
    layers: OptimalVideoLayer[] = [],
  ) => {
    const entry = this.findLayer(publishOption);
    if (entry) {
      entry.layers = layers;
    } else {
      this.layers.push({ publishOption, layers });
    }
  };

  private findTransceiver = (publishOption: Partial<PublishOption>) => {
    return this.cache.find(
      (item) =>
        item.publishOption.id === publishOption.id &&
        item.publishOption.trackType === publishOption.trackType,
    );
  };

  private findLayer = (publishOption: PublishOption) => {
    return this.layers.find(
      (item) =>
        item.publishOption.id === publishOption.id &&
        item.publishOption.trackType === publishOption.trackType,
    );
  };
}
