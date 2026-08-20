import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  DEFAULT_LOOPBACK_RECORDING_DURATION_MS,
  Icon,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  VideoPreview,
  useCall,
  useCallStateHooks,
  useLoopbackRecording,
} from '@stream-io/video-react-sdk';
import { PreCallTestStats } from './PreCallTestStats';
import { ToggleMicButton } from '../ToggleMicButton';
import { ToggleCameraButton } from '../ToggleCameraButton';

const formatRemaining = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const LoopbackBadge = ({
  icon,
  kind,
  stream,
}: {
  icon: string;
  kind: 'audio' | 'video';
  stream?: MediaStream;
}) => {
  const label = `Loopback ${kind}: ${stream ? 'receiving' : 'waiting'}`;
  return (
    <span
      className={clsx('rd__pre-call-test__loopback-badge', {
        'rd__pre-call-test__loopback-badge--live': !!stream,
      })}
      role="img"
      aria-label={label}
      title={label}
    >
      <span className="rd__pre-call-test__loopback-dot" />
      <Icon icon={icon} />
    </span>
  );
};

export const PreCallTest = () => {
  const call = useCall();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { isEnabled: isCameraEnabled } = useCameraState();
  const { isEnabled: isMicrophoneEnabled } = useMicrophoneState();
  const {
    startRecording,
    stopRecording,
    recordingState,
    loopbackAudioStream,
    loopbackVideoStream,
  } = useLoopbackRecording();

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<Error>();
  const [elapsedMs, setElapsedMs] = useState(0);

  const [recordingUrl, setRecordingUrl] = useState<string>();
  const recordingUrlRef = useRef<string | undefined>(undefined);

  const showRecording = useCallback((recording: Blob | undefined) => {
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    const url = recording ? URL.createObjectURL(recording) : undefined;
    recordingUrlRef.current = url;
    setRecordingUrl(url);
  }, []);

  useEffect(
    () => () => {
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    },
    [],
  );

  const isRecording = recordingState === 'recording';
  const isConnecting = isStarting && !isRecording;

  useEffect(() => {
    if (!isRecording) {
      setElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    const interval = setInterval(
      () => setElapsedMs(Date.now() - startedAt),
      250,
    );
    return () => clearInterval(interval);
  }, [isRecording]);

  const runTest = useCallback(async () => {
    if (!call) return;

    setError(undefined);
    setIsStarting(true);
    try {
      await call.join({ create: true, allowOwnTracksLoopback: true });
      const recording = await startRecording({ includeVideo: isCameraEnabled });

      if (recording) showRecording(recording.blob);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsStarting(false);
      call.leave().catch(console.error);
    }
  }, [call, startRecording, showRecording, isCameraEnabled]);

  const handleClick = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else if (recordingUrl) {
      showRecording(undefined);
    } else {
      await runTest();
    }
  }, [isRecording, recordingUrl, stopRecording, showRecording, runTest]);

  const hasRequiredDevices = isMicrophoneEnabled;
  const isIdle = !isRecording && !isConnecting && !recordingUrl;
  const needsMicrophone = isIdle && !hasRequiredDevices;

  const label = isRecording
    ? 'Stop recording'
    : isConnecting
      ? 'Connecting…'
      : recordingUrl
        ? 'Discard recording'
        : 'Record loopback';

  return (
    <div className="rd__pre-call-test">
      <div className="rd__pre-call-test__header">
        <h1 className="rd__pre-call-test__heading">
          Test your camera and microphone
        </h1>
        {isRecording && (
          <div className="rd__pre-call-test__header-status">
            <div className="rd__header__recording-indicator">Recording...</div>
            <div className="rd__header__elapsed">
              <div className="rd__header__elapsed-time" role="timer">
                {formatRemaining(
                  DEFAULT_LOOPBACK_RECORDING_DURATION_MS - elapsedMs,
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rd__pre-call-test__error" role="alert">
          {error.message}
        </p>
      )}
      <div className="rd__pre-call-test__stage">
        {recordingUrl ? (
          <video
            className="rd__pre-call-test__video"
            src={recordingUrl}
            controls
            playsInline
          />
        ) : (
          <>
            <VideoPreview />
            <div className="rd__pre-call-test__media-toggle">
              <ToggleAudioPreviewButton Menu={null} />
              <ToggleVideoPreviewButton Menu={null} />
            </div>
            <div className="rd__pre-call-test__loopback" role="status">
              <LoopbackBadge
                icon="mic"
                kind="audio"
                stream={loopbackAudioStream}
              />
              <LoopbackBadge
                icon="camera"
                kind="video"
                stream={loopbackVideoStream}
              />
            </div>
          </>
        )}
      </div>
      <div className="rd__pre-call-test__devices">
        <ToggleMicButton />
        <ToggleCameraButton />
      </div>

      {needsMicrophone && (
        <p className="rd__pre-call-test__status" role="status">
          Enable your microphone to run the test - a loopback recording always
          includes audio. Your camera is optional.
        </p>
      )}

      <button
        className="rd__button rd__button--primary rd__button--large rd__pre-call-test__action"
        type="button"
        onClick={handleClick}
        disabled={isConnecting || needsMicrophone}
      >
        {label}
      </button>
      {isStarting && <PreCallTestStats />}
    </div>
  );
};
