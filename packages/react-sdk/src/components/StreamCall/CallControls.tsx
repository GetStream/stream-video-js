import clsx from 'clsx';
import { Call, SfuModels } from '@stream-io/video-client';
import { useLocalParticipant } from '../../hooks/useParticipants';

export const CallControls = (props: { call: Call }) => {
  const { call } = props;
  const localParticipant = useLocalParticipant();
  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackKind.AUDIO_UNSPECIFIED,
  );
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackKind.VIDEO,
  );

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
