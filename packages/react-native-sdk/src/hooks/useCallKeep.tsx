import { useActiveCall } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useStreamVideoStoreValue } from '../contexts';
import { generateCallTitle } from '../utils';

type RNCallKeepType = typeof import('react-native-callkeep').default;

let RNCallKeep: RNCallKeepType | undefined;

try {
  RNCallKeep = require('react-native-callkeep').default;
} catch (e) {}

export const useCallKeep = () => {
  const activeCall = useActiveCall();
  const activeCallMeta = activeCall?.data.call;
  const activeCallDetails = activeCall?.data.details;
  if (!RNCallKeep) {
    throw Error(
      "react-native-callkeep library is not installed. Please install it using 'yarn add react-native-callkeep' or 'npm install react-native-callkeep'",
    );
  }

  const callTitle = generateCallTitle(
    activeCall?.data.details?.memberUserIds || [],
  );

  const startCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCallMeta && activeCallDetails) {
      await RNCallKeep?.startCall(
        activeCallMeta.id,
        callTitle,
        activeCallDetails.memberUserIds.join(','),
        'generic',
      );
    }
  }, [activeCallMeta, activeCallDetails, callTitle]);

  const endCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCallMeta) {
      await RNCallKeep?.endCall(activeCallMeta.id);
    }
  }, [activeCallMeta]);

  return { startCall, endCall };
};
