import {
  Call,
  CallContent,
  OwnCapability,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Alert,
  Button,
} from 'react-native';

const client = new StreamVideoClient({
  apiKey: 'par8f5s3gn2j',
  user: {
    id: 'dr-lecter',
    name: 'Dr. Hannibal Lecter',
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZHItbGVjdGVyIn0.LUKnU6Zc-ZKVaXbhYxALISlKX3cqum28Nk1emjFcHT0',
});

const ExtendSessionButton = ({
  durationSecsToExtend,
}: {
  durationSecsToExtend: number;
}) => {
  const call = useCall();
  const { useCallSettings, useHasPermissions } = useCallStateHooks();
  const settings = useCallSettings();
  const canExtend = useHasPermissions(OwnCapability.CHANGE_MAX_DURATION);

  if (!canExtend) {
    return null;
  }

  const onPress = () => {
    call?.update({
      settings_override: {
        limits: {
          max_duration_seconds:
            (settings?.limits?.max_duration_seconds ?? 0) +
            durationSecsToExtend,
        },
      },
    });
  };

  return (
    <Button
      onPress={onPress}
      title={`Extend by ${Math.round(((durationSecsToExtend / 60) * 10) / 10)} minutes`}
    />
  );
};

const useSessionTimer = () => {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  const [remainingMs, setRemainingMs] = useState(Number.NaN);

  useEffect(() => {
    if (!session?.timer_ends_at) {
      return;
    }
    const timeEndAtMillis = new Date(session.timer_ends_at).getTime();
    const handle = setInterval(() => {
      setRemainingMs(timeEndAtMillis - Date.now());
    }, 500);
    return () => clearInterval(handle);
  }, [session?.timer_ends_at]);

  return remainingMs;
};

function convertMillis(milliseconds: number) {
  // Calculate the number of minutes and seconds
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = ((milliseconds % 60000) / 1000).toFixed(0);

  // Format the output
  return `${minutes} mins:${seconds.padStart(2, '0')} secs`;
}

const useSessionTimerAlert = (remainingMs: number, thresholdMs: number) => {
  const didAlert = useRef(false);

  useEffect(() => {
    if (!didAlert.current && remainingMs < thresholdMs) {
      Alert.alert(
        'Notice',
        `Less than ${thresholdMs / 60000} minutes remaining`,
      );
      didAlert.current = true;
    }
  }, [remainingMs, thresholdMs]);
};

const SessionTimer = () => {
  const remainingMs = useSessionTimer();
  useSessionTimerAlert(remainingMs, 20 * 60 * 1000);
  return (
    <View style={styles.sessionTimer}>
      <Text style={styles.sessionTimerText}>{convertMillis(remainingMs)}</Text>
    </View>
  );
};

const RootContainer = (props: React.PropsWithChildren<{}>) => {
  return <SafeAreaView style={styles.container}>{props.children}</SafeAreaView>;
};

const callId = 'test-call2';

const App = () => {
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    const newCall = client.call('appointment', callId);
    newCall
      .join()
      .then(() => setCall(newCall))
      .catch(() => console.error('Failed to join the call'));

    return () => {
      newCall.leave().catch(() => console.error('Failed to leave the call'));
    };
  }, []);

  if (!call) {
    return (
      <RootContainer>
        <ActivityIndicator size={'large'} />
      </RootContainer>
    );
  }

  return (
    <RootContainer>
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <ExtendSessionButton durationSecsToExtend={10 * 60} />
          <CallContent />
        </StreamCall>
      </StreamVideo>
    </RootContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    justifyContent: 'center',
  },
  sessionTimer: {
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
  },
  sessionTimerText: {
    color: 'black',
    fontSize: 24,
    textAlign: 'center',
  },
});

export default App;
