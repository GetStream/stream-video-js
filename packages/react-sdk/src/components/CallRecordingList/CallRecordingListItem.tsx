import clsx from 'clsx';
import React, { ComponentProps, ForwardedRef, forwardRef } from 'react';
import { CallRecording } from '@stream-io/video-client';
import { CopyToClipboardButtonWithPopup } from '../Button';

export type CallRecordingListItemProps = {
  /** CallRecording object to represent */
  recording: CallRecording;
};
export const CallRecordingListItem = ({
  recording,
}: CallRecordingListItemProps) => {
  return (
    <div className="str-video__call-recording-list-item">
      <div className="str-video__call-recording-list-item__info">
        <div className="str-video__call-recording-list-item__created">
          {new Date(recording.end_time).toLocaleString()}
        </div>
      </div>
      <div className="str-video__call-recording-list-item__actions">
        <a
          className={clsx(
            'str-video__call-recording-list-item__action-button',
            'str-video__call-recording-list-item__action-button--download',
          )}
          role="button"
          href={recording.url}
          download={recording.filename}
          title="Download the recording"
        >
          <span
            className={clsx(
              'str-video__call-recording-list-item__action-button-icon',
              'str-video__download-button--icon',
            )}
          />
        </a>
        <CopyToClipboardButtonWithPopup
          Button={CopyUrlButton}
          copyValue={recording.url}
        />
      </div>
    </div>
  );
};
const CopyUrlButton = forwardRef(
  (props: ComponentProps<'button'>, ref: ForwardedRef<HTMLButtonElement>) => {
    return (
      <button
        {...props}
        className={clsx(
          'str-video__call-recording-list-item__action-button',
          'str-video__call-recording-list-item__action-button--copy-link',
        )}
        ref={ref}
        title="Copy the recording link"
      >
        <span
          className={clsx(
            'str-video__call-recording-list-item__action-button-icon',
            'str-video__copy-button--icon',
          )}
        />
      </button>
    );
  },
);
