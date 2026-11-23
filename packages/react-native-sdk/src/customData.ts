import '@stream-io/video-client';

// The custom call data key this SDK reads itself, declared the same way an
// app declares its own keys.
declare module '@stream-io/video-client' {
  interface CustomCallData {
    /**
     * The name shown for the call on the native calling UI of ringing calls.
     */
    display_name?: string;
  }
}
