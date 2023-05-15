import { StreamReaction } from '@stream-io/video-client';
import { defaultEmojiReactions } from '../constants';

type StreamReactionType = StreamReaction & {
  icon: string | JSX.Element;
};

type StreamVideoConfig = {
  /**
   * Handler called when the participants info button is pressed in the active call screen.
   */
  onOpenCallParticipantsInfoView?: () => void;
  /**
   * Supported Reactions
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
