import type { DefaultChannelData } from 'stream-chat-react';

declare module 'stream-chat' {
  interface CustomChannelData extends DefaultChannelData {
    subtitle?: string;
  }
}
