import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';

export class MicrophoneManagerState extends InputMediaDeviceManagerState {
  constructor() {
    super('disable-tracks');
  }

  protected getDeviceIdFromStream(stream: MediaStream): string | undefined {
    return stream.getAudioTracks()[0]?.getSettings().deviceId as
      | string
      | undefined;
  }
}
