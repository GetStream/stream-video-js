import clsx from 'clsx';
import { Call, CallMeta } from '@stream-io/video-client';
import { useParticipants } from '../../hooks/useParticipants';
import { useStreamVideoClient } from '../../StreamVideo';
import { useIsCallRecordingInProgress } from '../../hooks/useStore';

export const CallControls = (props: {
  call: Call;
  callMeta?: CallMeta.Call;
}) => {
  const { call, callMeta } = props;
  const client = useStreamVideoClient();
  const participants = useParticipants();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const localParticipant = participants.find((p) => p.isLoggedInUser);
  const isAudioMute = !localParticipant?.audio;
  const isVideoMute = !localParticipant?.video;

  return (
    <div className="str-video__call-controls">
      <Button
        icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
        title="Record call"
        onClick={() => {
          if (!callMeta) return;
          if (isCallRecordingInProgress) {
            client?.stopRecording(callMeta.id, callMeta.type);
          } else {
            client?.startRecording(callMeta.id, callMeta.type);
          }
        }}
      />
      <Button
        icon={isAudioMute ? 'mic-off' : 'mic'}
        onClick={() => {
          call.updateMuteState('audio', !isAudioMute);
        }}
      />
      <Button
        icon={isVideoMute ? 'camera-off' : 'camera'}
        onClick={() => {
          call.updateMuteState('video', !isVideoMute);
        }}
      />
      <Button
        icon="call-end"
        variant="danger"
        onClick={() => {
          call.leave();
          // FIXME: OL: move this away from here
          alert('Call ended. You may close the window now.');
        }}
      />
    </div>
  );
};

const Button = (props: {
  icon: string;
  variant?: string;
  onClick?: () => void;
  [prop: string]: any;
}) => {
  const { icon, variant, onClick, ...rest } = props;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={clsx(
        'str-video__call-controls__button',
        icon && `str-video__call-controls__button--icon-${icon}`,
        variant && `str-video__call-controls__button--variant-${variant}`,
      )}
      {...rest}
    />
  );
};
