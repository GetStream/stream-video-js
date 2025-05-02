import {
  StreamVideoParticipant,
  type VideoTrackType,
  getLogger,
} from '@stream-io/video-client';
import React, { createContext, useContext, useRef, RefObject } from 'react';
import { NativeModules, findNodeHandle, Platform } from 'react-native';

const { StreamVideoReactNative } = NativeModules;

type SnapshotContextType = {
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
const SnapshotContext = createContext<SnapshotContextType | undefined>(
  undefined,
);

// Reference map type
type RefMap = Map<string, RefObject<any>>;

export const SnapshotProvider = ({ children }: React.PropsWithChildren<{}>) => {
  // Use a ref to store the map of participant IDs to their view refs
  const participantRefs = useRef<RefMap>(new Map());

  // Register a participant's RTCView ref
  const register = (
    participant: StreamVideoParticipant,
    videoTrackType: VideoTrackType,
    ref: RefObject<any>,
  ) => {
    if (ref && participant.userId) {
      participantRefs.current.set(
        `${participant.userId}-${videoTrackType}`,
        ref,
      );
    }
  };

  const deregister = (
    participant: StreamVideoParticipant,
    videoTrackType: VideoTrackType,
  ) => {
    if (participant.userId) {
      participantRefs.current.delete(`${participant.userId}-${videoTrackType}`);
    }
  };

  // Take a snapshot of a specific participant's view
  const take = async (
    participant: StreamVideoParticipant,
    videoTrackType: VideoTrackType,
  ): Promise<string | null> => {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('SnapshotProvider is only supported on iOS');
      }

      if (!participant?.userId) {
        getLogger(['SnapshotProvider'])(
          'error',
          'Cannot take snapshot: Invalid participant',
        );
        return null;
      }

      const ref = participantRefs.current.get(
        `${participant.userId}-${videoTrackType}`,
      );
      if (!ref || !ref.current) {
        getLogger(['SnapshotProvider'])(
          'error',
          'Cannot take snapshot: No registered view for this participant',
        );
        return null;
      }

      // Get the native handle for the view
      const tag = findNodeHandle(ref.current);
      if (!tag) {
        getLogger(['SnapshotProvider'])(
          'error',
          'Cannot take snapshot: Cannot get native handle for view',
        );
        return null;
      }

      // Take the snapshot using our native module
      const base64Image = await StreamVideoReactNative.captureRef(tag, {
        // format: 'jpg',
        // quality: 0.8,
      });

      return base64Image;
    } catch (error) {
      getLogger(['SnapshotProvider'])(
        'error',
        'Error taking participant snapshot:',
        error,
      );
      return null;
    }
  };

  const value = {
    register,
    deregister,
    take,
  };

  return (
    <SnapshotContext.Provider value={value}>
      {children}
    </SnapshotContext.Provider>
  );
};

export const useSnapshot = (): SnapshotContextType => {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error('useSnapshot must be used within a SnapshotProvider');
  }
  return context;
};
