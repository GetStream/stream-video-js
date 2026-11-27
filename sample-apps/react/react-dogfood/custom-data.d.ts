import '@stream-io/video-react-sdk';

// Types the custom data of the calls across the whole app.
declare module '@stream-io/video-react-sdk' {
  interface CustomCallData {
    name?: string;
  }
  interface CustomEventData {
    type?: string;
    [key: string]: unknown;
  }
}
