import {
  useActiveCall,
  useLocalHangUpNotifications,
} from '@stream-io/video-react-bindings';
import {
  CallControls,
  DeviceSettings,
  Stage,
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/router';

type MeetingUIProps = {
  callId: string;
};

export const MeetingUI = ({ callId }: MeetingUIProps) => {
  const router = useRouter();
  const activeCall = useActiveCall();
  const hangups = useLocalHangUpNotifications();

  if (!activeCall) return <div>loading</div>;

  const shouldLeave = hangups.find((hangup) => hangup.call.id === callId);

  if (shouldLeave) {
    activeCall.leave();
    router.push('/');
  }

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
      <CallControls call={activeCall} />
    </div>
  );
};
