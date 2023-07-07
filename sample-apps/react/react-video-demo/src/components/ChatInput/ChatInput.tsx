import { useMemo, useCallback, ChangeEventHandler } from 'react';
import { UploadButton } from 'react-file-utils';
import classnames from 'classnames';
import { useDropzone } from 'react-dropzone';

import {
  ChatAutoComplete,
  useMessageInputContext,
  useChannelStateContext,
  useTranslationContext,
  AttachmentPreviewList,
} from 'stream-chat-react';

import {} from 'stream-chat';

import { Attachment, Send } from '../Icons';

import styles from './ChatInput.module.css';

export const ChatInput = () => {
  const { acceptedFiles = [], multipleUploads } =
    useChannelStateContext('MessageInputV2');

  const { t } = useTranslationContext('MessageInputV2');

  const {
    cooldownRemaining,
    handleSubmit,
    isUploadEnabled,
    maxFilesLeft,
    numberOfUploads,
    text,
    uploadNewFiles,
    handleChange,
  } = useMessageInputContext('MessageInputV2');

  const accept = useMemo(
    () =>
      acceptedFiles.reduce<Record<string, Array<string>>>(
        (mediaTypeMap, mediaType) => {
          mediaTypeMap[mediaType] ??= [];
          return mediaTypeMap;
        },
        {},
      ),
    [acceptedFiles],
  );

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    accept,
    disabled: !isUploadEnabled || maxFilesLeft === 0,
    multiple: multipleUploads,
    noClick: true,
    onDrop: uploadNewFiles,
  });

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      handleChange(event);
    },
    [handleChange],
  );

  const inputClassNames = classnames(styles.input, {
    [styles.uploads]: isUploadEnabled && !!numberOfUploads,
  });

  return (
    <>
      <div {...getRootProps({ className: 'str-chat__message-input' })}>
        {isDragActive && (
          <div
            className={classnames('str-chat__dropzone-container', {
              'str-chat__dropzone-container--not-accepted': isDragReject,
            })}
          >
            {!isDragReject && <p>{t<string>('Drag your files here')}</p>}
            {isDragReject && (
              <p>{t<string>('Some of the files will not be accepted')}</p>
            )}
          </div>
        )}

        <div className={styles.inputInner}>
          <div className={styles.inputContainer}>
            <UploadButton
              accept={acceptedFiles?.join(',')}
              aria-label="File upload"
              className={styles.fileInput}
              disabled={!isUploadEnabled || maxFilesLeft === 0}
              id="upload-file-button"
              multiple={multipleUploads}
              onFileChange={uploadNewFiles}
            />
            <label className={styles.inputLabel} htmlFor="upload-file-button">
              <Attachment className={styles.attachment} />
            </label>
          </div>

          <div className={styles.textareaContainer}>
            <div className={inputClassNames}>
              <div className={styles.previewContainer}>
                {isUploadEnabled && !!numberOfUploads && (
                  <AttachmentPreviewList />
                )}
              </div>

              <ChatAutoComplete
                onChange={onChange}
                placeholder="Send a message"
              />
            </div>
          </div>

          <button
            className={classnames(styles.button, {
              [styles.text]: text,
              [styles.cooldown]: cooldownRemaining,
            })}
            disabled={!text}
            onClick={handleSubmit}
          >
            <Send className={styles.send} />
          </button>
        </div>
      </div>
    </>
  );
};
