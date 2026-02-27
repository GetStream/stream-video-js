import { useCallback } from 'react';
import clsx from 'clsx';
import { DefaultParticipantViewUI } from '../../../core';
import { useParticipantViewContext } from '../../../core';

export const EmbeddedParticipantViewUI = () => {
  const { participantViewElement, trackType } = useParticipantViewContext();

  const handleDoubleClick = useCallback(() => {
    if (!participantViewElement) return;
    if (typeof participantViewElement.requestFullscreen === 'undefined') return;

    if (!document.fullscreenElement) {
      participantViewElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, [participantViewElement]);

  return (
    <div
      className={clsx(
        'str-video__embedded-participant-view-ui',
        trackType === 'screenShareTrack' &&
          'str-video__embedded-participant-view-ui--screen-share',
      )}
      onDoubleClick={handleDoubleClick}
    >
      <DefaultParticipantViewUI />
    </div>
  );
};
