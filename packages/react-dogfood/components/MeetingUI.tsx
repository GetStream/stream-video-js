import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useActiveCall } from '@stream-io/video-react-bindings';
import {
  CallControls,
  DeviceSettings,
  Stage,
} from '@stream-io/video-react-sdk';

export const MeetingUI = () => {
  const router = useRouter();
  const activeCall = useActiveCall();

  const onLeave = useCallback(() => {
    router.push('/');
  }, [router]);

  if (!activeCall) return <div>loading</div>;

  const { type, id } = activeCall.data.call;

  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {type}:{id}
        </h4>
        <DeviceSettings activeCall={activeCall} />
      </div>
      <Stage call={activeCall} />
      <CallControls call={activeCall} onLeave={onLeave} />
    </div>
  );
};
