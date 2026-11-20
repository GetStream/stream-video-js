import type {} from 'stream-chat-react';

declare module 'stream-chat' {
  interface CustomChannelData {
    subtitle?: string;
  }
}
