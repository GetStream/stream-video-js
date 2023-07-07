import { PropsWithChildren } from 'react';
import { Call } from '@stream-io/video-client';
import { StreamCallProvider } from '@stream-io/video-react-bindings';
import {
  MediaDevicesProvider,
  MediaDevicesProviderProps,
} from '../../contexts';

export type StreamCallProps = {
  call: Call | undefined;

  /**
   * An optional props to pass to the `MediaDevicesProvider`.
   */
  mediaDevicesProviderProps?: MediaDevicesProviderProps;
};

export const StreamCall = ({
  children,
  call,
  mediaDevicesProviderProps,
}: PropsWithChildren<StreamCallProps>) => {
  if (!call) {
    return null;
  }
  return (
    <StreamCallProvider call={call}>
      <MediaDevicesProvider {...mediaDevicesProviderProps}>
        {children}
      </MediaDevicesProvider>
    </StreamCallProvider>
  );
};
