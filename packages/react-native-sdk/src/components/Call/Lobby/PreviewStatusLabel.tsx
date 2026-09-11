import React from 'react';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { StatusLabel } from '../../utility/StatusLabel';

/**
 * Props for the PreviewStatusLabel component.
 */
export type PreviewStatusLabelProps = {
  /**
   * Overrides the label text, which defaults to the connected user's name.
   */
  label?: string;
  /**
   * @default false
   */
  showSpeechIndicator?: boolean;
};

export const PreviewStatusLabel = ({
  label,
  showSpeechIndicator = true,
}: PreviewStatusLabelProps) => {
  const { t } = useI18n();
  const connectedUser = useConnectedUser();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { optimisticIsMute: isVideoMuted } = useCameraState();
  const { optimisticIsMute: isAudioMuted } = useMicrophoneState();

  return (
    <StatusLabel
      label={label ?? connectedUser?.name ?? connectedUser?.id ?? t('You')}
      isAudioMuted={isAudioMuted}
      isVideoMuted={isVideoMuted}
      showSpeechIndicator={showSpeechIndicator}
    />
  );
};
