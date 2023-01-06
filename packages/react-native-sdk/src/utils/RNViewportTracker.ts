import { View } from 'react-native';
import { ViewportTracker } from '@stream-io/video-client';
import { SfuModels } from '@stream-io/video-client';

export type RNViewportTrackerOptions = {
  // TODO: define
};

export class RNViewportTracker
  implements ViewportTracker<View, RNViewportTrackerOptions>
{
  addObject = (
    sessionId: string,
    trackType: SfuModels.TrackType,
    element: View,
  ) => {
    // TODO: implement
    console.log('addObject', sessionId, trackType, element);
  };

  removeObject = (
    sessionId: string,
    trackType: SfuModels.TrackType,
    element: View,
  ) => {
    // TODO: implement
    console.log('removeObject', sessionId, trackType, element);
  };

  setViewport = (
    viewport: View | undefined,
    options: RNViewportTrackerOptions | undefined,
  ) => {
    // TODO: implement
    console.log('setViewport', viewport, options);
  };
}
