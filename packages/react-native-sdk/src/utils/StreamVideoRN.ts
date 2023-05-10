type StreamVideoConfig = {
  /**
   * Handler called when the participants info button is pressed in the active call screen.
   */
  onOpenCallParticipantsInfoView?: () => void;
  /**
   * Handler called when the reactions button is pressed in the call participant's view.
   */
  onOpenReactionsModal?: () => void;
};

const DEFAULT_STREAM_VIDEO_CONFIG = {};

export class StreamVideoRN {
  /**
   * Global config for StreamVideoRN.
   */
  static config: StreamVideoConfig = DEFAULT_STREAM_VIDEO_CONFIG;

  /**
   * Set global config for StreamVideoRN allows you to set wished CDN hosts for resizing images.
   * This function accepts an config object that will be merged with the default config.
   * @example StreamChatRN.setConfig({ onOpenCallParticipantsInfoView: () => {} });
   */
  static setConfig(config: Partial<StreamVideoConfig>) {
    this.config = { ...this.config, ...config };
  }
}
