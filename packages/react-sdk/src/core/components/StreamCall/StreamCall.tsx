import { PropsWithChildren } from 'react';
import { Call } from '@stream-io/video-client';
import { StreamCallProvider } from '@stream-io/video-react-bindings';

export type StreamCallProps = {
  call: Call;

  /**
   * An optional props to pass to the `MediaDevicesProvider`.
   */
  mediaDevicesProviderProps?: any;
};

export const StreamCall = ({
  children,
  call,
  mediaDevicesProviderProps,
}: PropsWithChildren<StreamCallProps>) => {
  if (mediaDevicesProviderProps) {
    console.warn('mediaDevicesProviderProps is deprecated');
  }
  return <StreamCallProvider call={call}>{children}</StreamCallProvider>;
};
