import { useActiveCall } from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { generateCallTitle } from '../utils';

type RNCallKeepType = typeof import('react-native-callkeep').default;

let RNCallKeep: RNCallKeepType | undefined;

try {
  RNCallKeep = require('react-native-callkeep').default;
} catch (e) {}

export const useCallKeep = () => {
  const activeCall = useActiveCall();
  const activeCallMeta = activeCall?.data;
  if (!RNCallKeep) {
    throw Error(
      "react-native-callkeep library is not installed. Please install it using 'yarn add react-native-callkeep' or 'npm install react-native-callkeep'",
    );
  }

  const callTitle = generateCallTitle(Object.keys(activeCallMeta?.users ?? {}));

  const startCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCallMeta) {
      await RNCallKeep?.startCall(
        activeCallMeta.call.id!,
        callTitle,
        Object.keys(activeCallMeta.users).join(','),
        'generic',
      );
    }
  }, [activeCallMeta, callTitle]);

  const endCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCallMeta) {
      await RNCallKeep?.endCall(activeCallMeta.call.id!);
    }
  }, [activeCallMeta]);

  return { startCall, endCall };
};
