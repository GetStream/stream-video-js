/**
 * `loading` means that a stream is currently being retrieved from the browser
 * `on` means that there is an ongoing media stream
 * `off` means that the user decided to turn off the stream
 * `initial` is the default state, which means we didn't try to start a stream yet
 */
export type ScreenShareState = 'loading' | 'on' | 'off' | 'initial';

/**
 * `disconnected` means the stream is lost due to a device being disconnected/lost
 * `error` means an error occurred while trying to retrieve a stream (for example the user didn't give permission to use camera/microphone)
 */
export type MediaStreamState = ScreenShareState | 'disconnected' | 'error';

/**
 * `detecting-speech-while-muted` means the audio is turned off by the user (audio stream is not transmitted in a call), but we have a local audio stream started in order to detect speech while muted
 */
export type AudioMediaStreamState =
  | MediaStreamState
  | 'detecting-speech-while-muted';
