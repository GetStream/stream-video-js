import '@stream-io/video-react-sdk';

// Types the custom data of the calls across the whole app.
declare module '@stream-io/video-react-sdk' {
  interface CustomCallData {
    title?: string;
  }
}
