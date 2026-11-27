import '@stream-io/video-react-sdk';

// Types the custom data of the calls across the whole app.
declare module '@stream-io/video-react-sdk' {
  interface CustomCallData {
    /** The CID of the chat channel the call was started from. */
    channelCid?: string;
  }
}
