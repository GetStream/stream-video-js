import {
  CallingState,
  OwnCapability,
  Restricted,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Button } from 'react-native';

export default function LiveButtons({ onJoined }: { onJoined: () => void }) {
  // this utility hook returns the call object from the <StreamCall /> context
  const call = useCall();
  const { useIsCallLive, useCallCallingState } = useCallStateHooks();
  // this utility hook is a wrapper around the `call.state.metadata$` observable,
  // and it will emit a new value whenever the call goes live or stops being live.
  // we can use it to update the button text or adjust any other UI elements
  const isLive = useIsCallLive();
  const { t } = useI18n();

  const callingState = useCallCallingState();

  const canJoin = ![
    CallingState.JOINING,
    CallingState.JOINED,
    CallingState.LEFT,
  ].includes(callingState);

  const hasJoined = callingState === CallingState.JOINED;

  if (!call) {
    return null;
  }

  return (
    <>
      {isLive && (
        <>
          <Restricted
            hasPermissionsOnly
            requiredGrants={[OwnCapability.END_CALL]}
          >
            <Button
              title={t('Stop Live and Leave')}
              onPress={async () => {
                try {
                  await call.stopLive();
                  await call.leave();
                } catch (error) {
                  console.log('Error Stop Live:', error);
                }
              }}
            />
          </Restricted>
          {canJoin && (
            <Button
              title={t('Join the live call')}
              onPress={async () => {
                try {
                  await call.join();
                  onJoined();
                } catch (error) {
                  console.log('Error joining call:', error);
                }
              }}
            />
          )}
        </>
      )}
      {!isLive && (
        <Restricted
          hasPermissionsOnly
          requiredGrants={[OwnCapability.JOIN_BACKSTAGE]}
        >
          <Button
            title={t('Start Live and Join')}
            onPress={async () => {
              try {
                await call.goLive();
                await call.join();
                onJoined();
              } catch (error) {
                console.log('Error Start Live and Join:', error);
              }
            }}
          />
        </Restricted>
      )}
      {hasJoined && (
        <Button
          title={t('Leave quietly')}
          onPress={async () => {
            try {
              await call.leave();
            } catch (error) {
              console.log('Error leaving call:', error);
            }
          }}
        />
      )}
    </>
  );
}
