import clsx from 'clsx';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import {
  CallRecording,
  CallRecordingList,
  IconButton,
  MenuToggle,
  ToggleMenuButtonProps,
  useCall,
} from '@stream-io/video-react-sdk';

export const CallRecordings = () => {
  const call = useCall();
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([]);
  const [loadingCallRecordings, setLoadingCallRecordings] = useState(false);

  const fetchCallRecordings = useCallback(() => {
    if (!call) return;
    call.queryRecordings().then(({ recordings }) => {
      setCallRecordings(recordings);
      setLoadingCallRecordings(false);
    });
  }, [call]);

  useEffect(() => {
    fetchCallRecordings();
  }, [fetchCallRecordings]);

  useEffect(() => {
    if (!call) return;
    const unsubscribeRecordingStopped = call.on('call.recording_stopped', () =>
      setLoadingCallRecordings(true),
    );

    // @ts-expect-error
    const unsubscribeRecordingReady = call.on('call.recording_ready', (e) => {
      // FIXME OL this event isn't yet available in the OpenAPI schema
      const { call_recording: recording } = e;
      setCallRecordings((prev) => [...prev, recording]);
      setLoadingCallRecordings(false);
    });

    return () => {
      unsubscribeRecordingReady();
      unsubscribeRecordingStopped();
    };
  }, [call]);

  return (
    <MenuToggle placement="bottom-end" ToggleButton={ToggleMenuButton}>
      <CallRecordingList
        callRecordings={callRecordings}
        loading={loadingCallRecordings}
        onRefresh={fetchCallRecordings}
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
