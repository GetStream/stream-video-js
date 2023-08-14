import clsx from 'clsx';
import { forwardRef, useEffect, useRef, useState } from 'react';
import {
  CallRecording,
  CallRecordingList,
  IconButton,
  MenuToggle,
  ToggleMenuButtonProps,
  useCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';

const MAX_NUMBER_POLL_REQUESTS = 6;
const POLL_INTERVAL_MS = 10 * 1000;

export const CallRecordings = () => {
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([]);
  const client = useStreamVideoClient();
  const activeCall = useCall();

  const [loadingCallRecordings, setLoadingCallRecordings] = useState(false);
  const recordingPollRequestsCount = useRef(0);
  const recordingPollRequestsInterval = useRef<
    ReturnType<typeof setInterval> | undefined
  >();

  useEffect(() => {
    if (!client || !activeCall || callRecordings.length === 0) return;
    const scheduleCallRecordingPolling = () => {
      setLoadingCallRecordings(true);

      if (recordingPollRequestsInterval.current) {
        clearInterval(recordingPollRequestsInterval.current);
      }

      recordingPollRequestsInterval.current = setInterval(async () => {
        let recordings: CallRecording[] = [];
        try {
          const response = await activeCall.queryRecordings();
          recordings = response.recordings;
        } catch (e) {
          console.error('Failed to query recordings', e);
        } finally {
          recordingPollRequestsCount.current++;
          const hasNewRecordings = callRecordings.length < recordings.length;

          if (
            recordingPollRequestsCount.current === MAX_NUMBER_POLL_REQUESTS ||
            hasNewRecordings
          ) {
            clearInterval(recordingPollRequestsInterval.current);
            setLoadingCallRecordings(false);
          }

          setCallRecordings(recordings);
        }
      }, POLL_INTERVAL_MS);
    };

    client.on('call.recording_stopped', scheduleCallRecordingPolling);

    return () => {
      client.off('call.recording_stopped', scheduleCallRecordingPolling);
    };
  }, [client, activeCall, callRecordings]);

  return (
    <MenuToggle placement="bottom-end" ToggleButton={ToggleMenuButton}>
      <CallRecordingList
        callRecordings={callRecordings}
        loading={loadingCallRecordings}
      />
    </MenuToggle>
  );
};

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  ({ menuShown }, ref) => {
    return (
      <IconButton
        className={clsx('str-video__call-recordings__toggle-button', {
          'str-video__call-recordings__toggle-button--active': menuShown,
        })}
        icon="call-recordings"
        ref={ref}
        title={menuShown ? 'Close' : 'Call recordings'}
      />
    );
  },
);
