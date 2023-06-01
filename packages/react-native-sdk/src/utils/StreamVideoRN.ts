import { StreamReaction } from '@stream-io/video-client';
import { defaultEmojiReactions } from '../constants';

type StreamReactionType = StreamReaction & {
  icon: string | JSX.Element;
};

type StreamVideoConfig = {
  /**
   * Reactions that are to be supported in the app.
   *
   * Note: This is an array of reactions that is rendered in the Reaction list.
   */
  supportedReactions: StreamReactionType[];
};

const DEFAULT_STREAM_VIDEO_CONFIG = {
  supportedReactions: defaultEmojiReactions,
};

export class StreamVideoRN {
  /**
   * Global config for StreamVideoRN.
   */
  static config: StreamVideoConfig = DEFAULT_STREAM_VIDEO_CONFIG;

  /**
   * Set global config for StreamVideoRN allows you to set wished CDN hosts for resizing images.
   * This function accepts an config object that will be merged with the default config.
   * @example StreamVideoRN.setConfig({ onOpenCallParticipantsInfoView: () => {} });
   */
  static setConfig(config: Partial<StreamVideoConfig>) {
    this.config = { ...this.config, ...config };
  }
}
