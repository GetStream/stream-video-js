import { ComponentType, PropsWithChildren } from 'react';
import {
  StreamCallProvider,
  StreamCallProviderProps,
} from '@stream-io/video-react-bindings';

// re-exporting the StreamCallProvider as StreamCall
export const StreamCall: ComponentType<
  PropsWithChildren<StreamCallProviderProps>
> = StreamCallProvider;

StreamCall.displayName = 'StreamCall';
