export interface User {
  id: string;
  name?: string;
  imageUrl?: string;
}

declare module '@stream-io/video-react-sdk' {
  interface CustomCallData {
    description?: string;
    hosts?: User[];
    speakerIds?: string[];
    title?: string;
  }
}
