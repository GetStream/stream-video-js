import 'stream-chat';

declare module 'stream-chat' {
  interface CustomUserData {
    email?: string;
  }
}
