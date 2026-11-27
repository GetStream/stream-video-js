import '@stream-io/video-react-native-sdk';

declare module '@stream-io/video-react-native-sdk' {
  interface CustomCallData {
    title?: string;
    description?: string;
    hosts?: { id: string; name: string; image: string | undefined }[];
  }
}
