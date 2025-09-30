import { PublishOption } from '../gen/video/sfu/models/models';
import type { OptimalVideoLayer } from './layers';
import type { PublishBundle, TrackLayersCache } from './types';

export class TransceiverCache {
  private readonly cache: PublishBundle[] = [];
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
  add = (bundle: PublishBundle) => {
    this.cache.push(bundle);
    this.transceiverOrder.push(bundle.transceiver);
  };

  /**
   * Gets the transceiver for the given publish option.
   */
  get = (publishOption: PublishOption): PublishBundle | undefined => {
    return this.cache.find(
      (bundle) =>
        bundle.publishOption.id === publishOption.id &&
        bundle.publishOption.trackType === publishOption.trackType,
    );
  };

  /**
   * Updates the cached bundle with the given patch.
   */
  update = (publishOption: PublishOption, patch: Partial<PublishBundle>) => {
    const bundle = this.get(publishOption);
    if (bundle) Object.assign(bundle, patch);
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
    predicate: (bundle: PublishBundle) => boolean,
  ): PublishBundle | undefined => {
    return this.cache.find(predicate);
  };

  /**
   * Provides all the items in the cache.
   */
  items = (): PublishBundle[] => {
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

  private findLayer = (publishOption: PublishOption) => {
    return this.layers.find(
      (item) =>
        item.publishOption.id === publishOption.id &&
        item.publishOption.trackType === publishOption.trackType,
    );
  };
}
