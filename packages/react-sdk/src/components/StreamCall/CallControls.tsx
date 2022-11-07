import clsx from 'clsx';
import { Call } from '@stream-io/video-client';
import { useParticipants } from '../../hooks/useParticipants';
export const CallControls = (props: { call: Call }) => {
  const { call } = props;
  const participants = useParticipants();
  const localParticipant = participants.find((p) => p.isLoggedInUser);
  const isAudioMute = !localParticipant?.audio;
  const isVideoMute = !localParticipant?.video;

  return (
    <div className="str-video__call-controls">
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
}) => {
  const { icon, variant, onClick } = props;
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
    />
  );
};
