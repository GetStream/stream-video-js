import { StreamVideoParticipant } from '@stream-io/video-client';
import React, { createContext, useContext, useRef, RefObject } from 'react';
import { NativeModules, findNodeHandle } from 'react-native';

const { StreamVideoReactNative } = NativeModules;

type SnapshotContextType = {
  register: (participant: StreamVideoParticipant, ref: RefObject<any>) => void;
  take: (participant: StreamVideoParticipant) => Promise<string | null>;
};

// Create the context with a default undefined value
const SnapshotContext = createContext<SnapshotContextType | undefined>(
  undefined,
);

// Reference map type
type RefMap = Map<string, RefObject<any>>;

type SnapshotProviderProps = {
  children: React.ReactNode;
};

export const SnapshotProvider = ({ children }: SnapshotProviderProps) => {
  // Use a ref to store the map of participant IDs to their view refs
  const participantRefs = useRef<RefMap>(new Map());

  // Register a participant's RTCView ref
  const register = (
    participant: StreamVideoParticipant,
    ref: RefObject<any>,
  ) => {
    if (ref && participant.userId) {
      participantRefs.current.set(participant.userId, ref);
    }
  };

  // Take a snapshot of a specific participant's view
  const take = async (
    participant: StreamVideoParticipant,
  ): Promise<string | null> => {
    try {
      if (!participant?.userId) {
        console.error('Cannot take snapshot: Invalid participant');
        return null;
      }

      const ref = participantRefs.current.get(participant.userId);
      console.log(
        '🚀 ~ SnapshotProvider ~ participantRefs:',
        participantRefs,
        participant.userId,
      );
      if (!ref || !ref.current) {
        console.error(
          'Cannot take snapshot: No registered view for this participant',
        );
        return null;
      }

      // Get the native handle for the view
      const tag = findNodeHandle(ref.current);
      if (!tag) {
        console.error(
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
      console.error('Error taking participant snapshot:', error);
      return null;
    }
  };

  const value = {
    register,
    take,
  };

  return (
    <SnapshotContext.Provider value={value}>
      {children}
    </SnapshotContext.Provider>
  );
};

export const useSnapshot = (): SnapshotContextType | undefined => {
  return useContext(SnapshotContext);
};
