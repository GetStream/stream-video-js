import { useCallback } from 'react';
import { useScreenshotIosContext } from '../contexts/internal/ScreenshotIosContext';
import { NativeModules, Platform } from 'react-native';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import {
  StreamVideoParticipant,
  getLogger,
  type VideoTrackType,
} from '@stream-io/video-client';

const { StreamVideoReactNative } = NativeModules;

/**
 * Hook that provides functionality to take screenshots of participant video streams.
 *
 * @returns An object containing the `takeScreenShot` function that captures a participant's video.
 */
type UseScreenshotResult = {
  /**
   * Takes a screenshot of a participant's video stream.
   *
   * @param participant - The participant whose video stream to capture
   * @param videoTrackType - The type of video track to capture ('videoTrack' or 'screenShareTrack')
   * @returns A Promise that resolves to a base64-encoded png image string or null if the screenshot fails
   */
  takeScreenshot: (
    participant: StreamVideoParticipant,
    videoTrackType: VideoTrackType,
  ) => Promise<string | null>;
};

export function useScreenshot(): UseScreenshotResult {
  const { take } = useScreenshotIosContext();
  const takeScreenshot = useCallback(
    async (
      participant: StreamVideoParticipant,
      videoTrackType: VideoTrackType,
    ) => {
      if (Platform.OS === 'android') {
        const { videoStream, screenShareStream } = participant;

        const videoStreamForScreenshot = (videoTrackType === 'screenShareTrack'
          ? screenShareStream
          : videoStream) as unknown as MediaStream | undefined;

        if (videoStreamForScreenshot) {
          try {
            return await StreamVideoReactNative.takeScreenshot(
              videoStreamForScreenshot.toURL(),
            );
          } catch (error) {
            getLogger(['useScreenshot'])(
              'error',
              'Error taking screenshot',
              error,
            );
            return null;
          }
        }
        return null;
      } else {
        try {
          return await take(participant, videoTrackType);
        } catch (error) {
          getLogger(['useScreenshot'])(
            'error',
            'Error taking screenshot',
            error,
          );
          return null;
        }
      }
    },
    [take],
  );

  return { takeScreenshot };
}
