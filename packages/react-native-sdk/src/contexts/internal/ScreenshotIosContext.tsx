import {
  StreamVideoParticipant,
  type VideoTrackType,
  getLogger,
} from '@stream-io/video-client';
import React, {
  createContext,
  useContext,
  RefObject,
  useCallback,
  useMemo,
} from 'react';
import { NativeModules, findNodeHandle, Platform } from 'react-native';

const { StreamVideoReactNative } = NativeModules;

type ScreenshotIosContextType = {
  register: (
    participant: StreamVideoParticipant,
    videoTrackType: VideoTrackType,
    ref: RefObject<any>,
  ) => void;
  deregister: (
    participant: StreamVideoParticipant,
    videoTrackType: VideoTrackType,
  ) => void;
  take: (
    participant: StreamVideoParticipant,
    videoTrackType: VideoTrackType,
  ) => Promise<string | null>;
};

// Create the context with a default undefined value
const ScreenshotIosContext = createContext<
  ScreenshotIosContextType | undefined
>(undefined);

const participantVideoViewRefMap: Map<string, RefObject<any>> = new Map();

export const ScreenshotIosContextProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  // Register a participant's RTCView ref
  const register = useCallback(
    (
      participant: StreamVideoParticipant,
      videoTrackType: VideoTrackType,
      ref: RefObject<any>,
    ) => {
      if (ref && participant.userId) {
        participantVideoViewRefMap.set(
          `${participant.userId}-${videoTrackType}`,
          ref,
        );
      }
    },
    [],
  );

  const deregister = useCallback(
    (participant: StreamVideoParticipant, videoTrackType: VideoTrackType) => {
      if (participant.userId) {
        participantVideoViewRefMap.delete(
          `${participant.userId}-${videoTrackType}`,
        );
      }
    },
    [],
  );

  // Take a snapshot of a specific participant's view
  const take = useCallback(
    async (
      participant: StreamVideoParticipant,
      videoTrackType: VideoTrackType,
    ): Promise<string | null> => {
      try {
        if (Platform.OS !== 'ios') {
          throw new Error(
            'ScreenshotIosContextProvider is only supported on iOS',
          );
        }

        const ref = participantVideoViewRefMap.get(
          `${participant.userId}-${videoTrackType}`,
        );
        if (!ref || !ref.current) {
          getLogger(['ScreenshotIosContextProvider'])(
            'error',
            'Cannot take snapshot: No registered view for this participant',
          );
          return null;
        }

        // Get the native handle for the view
        const tag = findNodeHandle(ref.current);
        if (!tag) {
          getLogger(['ScreenshotIosContextProvider'])(
            'error',
            'Cannot take snapshot: Cannot get native handle for view',
          );
          return null;
        }

        // Take the snapshot using our native module
        const base64Image = await StreamVideoReactNative.captureRef(tag, {});

        return base64Image;
      } catch (error) {
        getLogger(['ScreenshotIosContextProvider'])(
          'error',
          'Error taking participant snapshot:',
          error,
        );
        return null;
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      register,
      deregister,
      take,
    }),
    [register, deregister, take],
  );

  return (
    <ScreenshotIosContext.Provider value={value}>
      {children}
    </ScreenshotIosContext.Provider>
  );
};

export const useScreenshotIosContext = (): ScreenshotIosContextType => {
  const context = useContext(ScreenshotIosContext);
  if (!context) {
    throw new Error(
      'useScreenshotIosContext must be used within a ScreenshotIosContextProvider',
    );
  }
  return context;
};
