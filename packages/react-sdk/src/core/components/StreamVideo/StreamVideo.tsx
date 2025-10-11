import {
  type StreamVideoProps,
  StreamVideoProvider,
} from '@stream-io/video-react-bindings';
import type { PropsWithChildren } from 'react';
import { translations } from '../../../translations';

export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  return (
    <StreamVideoProvider translationsOverrides={translations} {...props} />
  );
};

StreamVideo.displayName = 'StreamVideo';
