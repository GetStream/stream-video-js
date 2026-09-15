import React, { useMemo, useState } from 'react';
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
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { Z_INDEX } from '../../constants';

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
  const styles = useStyles();

  if (!call) {
    return null;
  }

  return (
    <View style={styles.container}>
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
  const styles = useStyles();
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

const Row = ({ label, value }: { label: string; value?: string }) => {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value || '—'}
      </Text>
    </View>
  );
};

const formatMap = (map?: { [key: string]: string }) => {
  const userIds = Object.keys(map ?? {});
  return userIds.length > 0 ? userIds.join(', ') : undefined;
};

const useStyles = () => {
  const {
    theme: { semantics, primitives, insets },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        position: 'absolute',
        left: primitives.spacingMd,
        right: primitives.spacingMd,
        top: insets.top + primitives.spacingMd,
        zIndex: Z_INDEX.IN_FRONT,
        backgroundColor: semantics.backgroundCoreOverlayLight,
        borderRadius: 8,
        overflow: 'hidden',
      },
      header: {
        paddingVertical: primitives.spacingSm,
        paddingHorizontal: primitives.spacingMd,
      },
      headerText: {
        color: semantics.textOnAccent,
        fontSize: 14,
        fontWeight: 'bold',
      },
      body: {
        maxHeight: 320,
        paddingHorizontal: primitives.spacingMd,
        paddingBottom: primitives.spacingMd,
      },
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
      },
      rowLabel: {
        color: semantics.textSecondary,
        fontSize: 12,
        marginRight: primitives.spacingSm,
      },
      rowValue: {
        color: semantics.textOnAccent,
        fontSize: 12,
        flexShrink: 1,
      },
      button: {
        marginTop: primitives.spacingSm,
        paddingVertical: primitives.spacingSm,
        borderRadius: 6,
        backgroundColor: semantics.accentPrimary,
        alignItems: 'center',
      },
      buttonDisabled: {
        backgroundColor: semantics.borderUtilityDisabled,
      },
      buttonText: {
        color: semantics.textOnAccent,
        fontSize: 13,
        fontWeight: '600',
      },
      error: {
        color: semantics.accentError,
        fontSize: 12,
        marginTop: primitives.spacingSm,
      },
      hint: {
        color: semantics.textSecondary,
        fontSize: 11,
        marginTop: primitives.spacingSm,
      },
      json: {
        color: semantics.textSecondary,
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      },
    });
  }, [semantics, primitives, insets]);
};
