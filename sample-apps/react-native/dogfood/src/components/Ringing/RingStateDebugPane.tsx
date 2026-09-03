import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Call,
  GetCallRingStateResponse,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appTheme } from '../../theme';

/**
 * Dev-only pane for inspecting the ring outcome of the active ringing call:
 * the state the WebSocket delivered, next to what the `ring_state` endpoint
 * returns on demand.
 *
 * Collapsed by default so it does not cover the ringing UI it is used to debug.
 */
export const RingStateDebugPane = () => {
  const call = useCall();
  const [expanded, setExpanded] = useState(false);
  const { top } = useSafeAreaInsets();

  if (!call) {
    return null;
  }

  return (
    <View style={[styles.container, { top: top + appTheme.spacing.md }]}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <Text style={styles.headerText}>{expanded ? '▾' : '▸'} Ring state</Text>
      </Pressable>
      {expanded && <RingStateDebug call={call} />}
    </View>
  );
};

const RingStateDebug = ({ call }: { call: Call }) => {
  const { useCallCallingState, useCallSession } = useCallStateHooks();
  const callingState = useCallCallingState();
  const session = useCallSession();
  const [polled, setPolled] = useState<GetCallRingStateResponse>();
  const [polledAt, setPolledAt] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPolling, setIsPolling] = useState(false);

  const handlePoll = async () => {
    setIsPolling(true);
    setError(undefined);
    try {
      setPolled(await call.getRingState());
      setPolledAt(new Date().toLocaleTimeString());
    } catch (err) {
      setPolled(undefined);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPolling(false);
    }
  };

  return (
    <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
      <Row label="CID" value={call.cid} />
      <Row label="Created by me" value={String(call.isCreatedByMe)} />
      <Row label="Calling state" value={callingState} />
      <Row label="Session" value={session?.id} />
      <Row label="Accepted" value={formatMap(session?.accepted_by)} />
      <Row label="Rejected" value={formatMap(session?.rejected_by)} />
      <Row label="Missed" value={formatMap(session?.missed_by)} />
      <Pressable
        style={[styles.button, isPolling && styles.buttonDisabled]}
        disabled={isPolling || !session?.id}
        onPress={handlePoll}
      >
        <Text style={styles.buttonText}>
          {isPolling ? 'Reading…' : 'Read ring state'}
        </Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      {polled && (
        <>
          <Text style={styles.hint}>Read at {polledAt}</Text>
          <Text style={styles.json}>{JSON.stringify(polled, null, 2)}</Text>
        </>
      )}
    </ScrollView>
  );
};

const Row = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={1}>
      {value || '—'}
    </Text>
  </View>
);

const formatMap = (map?: { [key: string]: string }) => {
  const userIds = Object.keys(map ?? {});
  return userIds.length > 0 ? userIds.join(', ') : undefined;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: appTheme.spacing.md,
    right: appTheme.spacing.md,
    zIndex: appTheme.zIndex.IN_FRONT,
    backgroundColor: appTheme.colors.static_overlay,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
  },
  headerText: {
    color: appTheme.colors.static_white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  body: {
    maxHeight: 320,
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rowLabel: {
    color: appTheme.colors.light_gray,
    fontSize: 12,
    marginRight: appTheme.spacing.sm,
  },
  rowValue: {
    color: appTheme.colors.static_white,
    fontSize: 12,
    flexShrink: 1,
  },
  button: {
    marginTop: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.sm,
    borderRadius: 6,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: appTheme.colors.disabled,
  },
  buttonText: {
    color: appTheme.colors.static_white,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: appTheme.colors.error,
    fontSize: 12,
    marginTop: appTheme.spacing.sm,
  },
  hint: {
    color: appTheme.colors.light_gray,
    fontSize: 11,
    marginTop: appTheme.spacing.sm,
  },
  json: {
    color: appTheme.colors.light_blue,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
