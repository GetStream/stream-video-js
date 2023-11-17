import { useCallback, useEffect, useState } from 'react';
import {
  CallRecording,
  CallRecordingList,
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

    const unsubscribeRecordingReady = call.on('call.recording_ready', (e) => {
      if (e.type !== 'call.recording_ready') return;
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
    <CallRecordingList
      callRecordings={callRecordings}
      loading={loadingCallRecordings}
      onRefresh={fetchCallRecordings}
    />
  );
};
