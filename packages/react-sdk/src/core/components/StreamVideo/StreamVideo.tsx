import {
  StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren } from 'react';
import { translations } from '../../../translations';

export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  return (
    <StreamVideoProvider translationsOverrides={translations} {...props} />
  );
};
