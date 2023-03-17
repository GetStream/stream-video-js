import { useActiveCall } from '@stream-io/video-react-bindings';
import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { generateCallTitle } from '../utils';

type RNCallKeepType = typeof import('react-native-callkeep').default;

let RNCallKeep: RNCallKeepType | undefined;

try {
  RNCallKeep = require('react-native-callkeep').default;
} catch (e) {}

/**
 *
 * @returns
 *
 */
export const useCallKeep = () => {
  const activeCall = useActiveCall();
  if (!RNCallKeep) {
    throw Error(
      "react-native-callkeep library is not installed. Please install it using 'yarn add react-native-callkeep' or 'npm install react-native-callkeep'",
    );
  }

  const users = activeCall?.state.getCurrentValue(activeCall.state.members$);
  const userIds = useMemo(() => Object.keys(users || {}), [users]);
  const callTitle = generateCallTitle(userIds);

  const startCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCall) {
      await RNCallKeep?.startCall(
        activeCall.id,
        callTitle,
        userIds.join(','),
        'generic',
      );
    }
  }, [activeCall, callTitle, userIds]);

  const endCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCall) {
      await RNCallKeep?.endCall(activeCall.id);
    }
  }, [activeCall]);

  return { startCall, endCall };
};
