import { useEffect } from 'react';
import { voipPushNotificationCallCId$ } from '../../utils/push/rxSubjects';
import { RxUtils } from '@stream-io/video-client';
import {
  iosCallkeepAcceptCall,
  iosCallkeepRejectCall,
} from '../../utils/push/ios';
import { getCallKeepLib } from '../../utils/push/libs';
import { StreamVideoRN } from '../../utils';
import { Platform } from 'react-native';

/**
 * This hook is used to listen to callkeep events and do the necessary actions
 */
export const useIosCallKeepEffect = () => {
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig) {
      return;
    }
    console.log('callkeep listeners set');
    const callkeep = getCallKeepLib();
    callkeep.addEventListener('answerCall', ({ callUUID }) => {
      const call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
      console.log('answer call', { call_cid });
      iosCallkeepAcceptCall(call_cid, callUUID, pushConfig);
    });
    callkeep.addEventListener('endCall', async ({ callUUID }) => {
      const call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
      console.log('end call', { call_cid });
      await iosCallkeepRejectCall(call_cid, callUUID, pushConfig);
    });

    return () => {
      console.log('remove listeners');
      callkeep.removeEventListener('answerCall');
      callkeep.removeEventListener('endCall');
    };
  }, []);
};
