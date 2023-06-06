import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  ChangeEventHandler,
} from 'react';
import { UploadButton } from 'react-file-utils';
import classnames from 'classnames';
import { useDropzone } from 'react-dropzone';
import { nanoid } from 'nanoid';

import {
  ChatAutoComplete,
  useMessageInputContext,
  useChannelStateContext,
  useTranslationContext,
  AttachmentPreviewList,
} from 'stream-chat-react';

import {} from 'stream-chat';

import { Bolt, Attachment, People as GiphySearch, Send } from '../Icons';

import { useGiphyContext } from '../../contexts/GiphyContext';

import styles from './ChatInput.module.css';

export const ChatInput = () => {
  const { acceptedFiles = [], multipleUploads } =
    useChannelStateContext('MessageInputV2');

  const { t } = useTranslationContext('MessageInputV2');

  const [commandsOpen, setCommandsOpen] = useState(false);

  const { giphyState, setGiphyState } = useGiphyContext();

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

  const id = useMemo(() => nanoid(), []);

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
      const { value } = event.target;

      const deletePressed =
        event.nativeEvent instanceof InputEvent &&
        event.nativeEvent.inputType === 'deleteContentBackward';

      if (text.length === 1 && deletePressed) {
        setGiphyState(false);
      }

      if (!giphyState && text.startsWith('/giphy') && !numberOfUploads) {
        event.target.value = value.replace('/giphy', '');

        setGiphyState(true);
      }

      handleChange(event);
    },
    [text, giphyState, numberOfUploads],
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
              id={id}
              multiple={multipleUploads}
              onFileChange={uploadNewFiles}
            />
            <label className={styles.inputLabel} htmlFor={id}>
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

// import {
//   FC,
//   useCallback,
//   useEffect,
//   useState,
//   useRef,
//   ChangeEvent,
// } from 'react';
// import { ChatAutoComplete, useMessageInputContext } from 'stream-chat-react';
// import classnames from 'classnames';

// import { Bolt, Attachment, People as GiphySearch, Send } from '../Icons';

// // import { useGiphyContext } from '../../contexts/GiphyContext';

// import styles from './ChatInput.module.css';

// export const FileUpload: FC<{
//   channelId: string;
//   uploadFile(file: File): () => void;
// }> = ({ uploadFile }) => {
//   const inputRef = useRef<HTMLInputElement | null>(null);

//   const handleUploadClick = () => {
//     inputRef.current?.click();
//   };

//   const handleFileChange = useCallback(
//     (e: ChangeEvent<HTMLInputElement>) => {
//       if (!e.target.files) {
//         return;
//       }

//       uploadFile(e.target.files[0]);
//     },
//     [uploadFile],
//   );

//   return (
//     <div onClick={handleUploadClick}>
//       <Attachment className={styles.attachment} />
//       <input
//         type="file"
//         ref={inputRef}
//         onChange={handleFileChange}
//         style={{ display: 'none' }}
//       />
//     </div>
//   );
// };

// export type Props = {
//   channelId: string;
// };
// export const ChatInput: FC<Props> = ({ channelId }) => {
//   const {
//     closeCommandsList,
//     cooldownRemaining,
//     handleChange,
//     handleSubmit,
//     numberOfUploads,
//     openCommandsList,
//     doFileUploadRequest,
//     text,
//   } = useMessageInputContext();
//   const [giphyState, setGiphyState] = useState<boolean>();

//   // const { giphyState, setGiphyState } = useGiphyContext();

//   const [commandsOpen, setCommandsOpen] = useState(false);

//   useEffect(() => {
//     const handleClick = () => {
//       closeCommandsList();
//       setCommandsOpen(false);
//     };

//     if (commandsOpen) document.addEventListener('click', handleClick);
//     return () => document.removeEventListener('click', handleClick);
//   }, [commandsOpen]); // eslint-disable-line

//   const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
//     (event) => {
//       const { value } = event.target;

//       const deletePressed =
//         event.nativeEvent instanceof InputEvent &&
//         event.nativeEvent.inputType === 'deleteContentBackward';

//       if (text.length === 1 && deletePressed) {
//         setGiphyState(false);
//       }

//       if (!giphyState && text.startsWith('/giphy') && !numberOfUploads) {
//         event.target.value = value.replace('/giphy', '');
//         setGiphyState(true);
//       }

//       handleChange(event);
//     },
//     [text, giphyState, numberOfUploads], // eslint-disable-line
//   );

//   const handleFileUpload = useCallback(
//     (file: File) => {
//       doFileUploadRequest(file, channelId);
//     },
//     [channelId],
//   );

//   const handleCommandsClick = () => {
//     openCommandsList();
//     setGiphyState(false);
//     setCommandsOpen(true);
//   };

//   return (
//     <div className={styles.root}>
//       <div className={styles.container}>
//         {/* <div onClick={handleFileUpload}> */}
//         {/* <FileUpload uploadFile={handleFileUpload}} /> */}
//         {/* </div> */}
//         <div onClick={handleCommandsClick}>
//           <Bolt className={styles.bolt} />
//         </div>
//         <div className={styles.input}>
//           <ChatAutoComplete onChange={onChange} placeholder="Send a message" />
//         </div>

//         {giphyState && <GiphySearch />}
//       </div>
//       <button
//         className={classnames(styles.button, {
//           [styles.text]: text,
//           [styles.cooldown]: cooldownRemaining,
//         })}
//         disabled={!text}
//         onClick={handleSubmit}
//       >
//         <Send className={styles.send} />
//       </button>
//     </div>
//   );
// };
