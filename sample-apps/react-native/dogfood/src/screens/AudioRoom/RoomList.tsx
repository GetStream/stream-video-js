import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  Pressable,
  StyleSheet,
  Text,
  Button,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { appTheme } from '../../theme';
import {
  Call,
  useI18n,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import CreateRoomModal from './CreateRoomModal';
import { SafeAreaView } from 'react-native-safe-area-context';

type RoomFlatList = FlatListProps<Call>;

type Props = {
  setCall: (call: Call) => void;
};

const RoomList = (props: Props) => {
  const { setCall } = props;
  const client = useStreamVideoClient();
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingError, setLoadingError] = useState<Error>();
  const { t } = useI18n();
  // state for the pull to refresh
  const [refreshing, setRefreshing] = React.useState(false);
  // holds the cursor to the next page of calls
  const nextPage = useRef<string>();

  const queryLiveCalls = useCallback(async () => {
    if (!client || client.user?.id === undefined) {
      return;
    }
    setLoadingCalls(true);
    setLoadingError(undefined);
    // get all the audio room calls
    try {
      const filterForJoinableCalls = {
        type: 'audio_room',
        ended_at: null,
        'custom.title': { $exists: true },
        'custom.description': { $exists: true },
      };
      const result = await client.queryCalls({
        filter_conditions: filterForJoinableCalls,
        sort: [{ field: 'created_at', direction: -1 }],
        limit: 10,
        next: nextPage.current,
        watch: true,
      });
      nextPage.current = result.next;
      setCalls((prev) => [...prev, ...result.calls]);
    } catch (e) {
      if (e instanceof Error) {
        setLoadingError(e);
      }
    } finally {
      setLoadingCalls(false);
    }
  }, [client]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    nextPage.current = undefined;
    setCalls([]);
    await queryLiveCalls();
    setRefreshing(false);
  }, [queryLiveCalls]);

  // query live calls on initial render
  const initialRunDoneRef = useRef(false);
  useEffect(() => {
    if (!initialRunDoneRef.current) {
      initialRunDoneRef.current = true;
      queryLiveCalls();
      return;
    }
  }, [queryLiveCalls]);

  // listen to new calls that were created with the current user as a member
  useEffect(() => {
    if (!client) {
      return;
    }
    return client.on('call.created', (e) => {
      if (e.type !== 'call.created') {
        return;
      }
      const callResponse = e.call;
      if (callResponse.type !== 'audio_room') {
        return;
      }
      setCalls((prevCalls) => {
        for (const c of prevCalls) {
          if (c.cid === callResponse.cid) {
            return prevCalls;
          }
        }
        const newCall = client.call(callResponse.type, callResponse.id);
        newCall.get();
        return [newCall, ...prevCalls];
      });
    });
  }, [client]);

  const renderItem: NonNullable<RoomFlatList['renderItem']> = useCallback(
    ({ item: callItem }) => {
      return (
        <Pressable
          style={(state) =>
            state.pressed
              ? [styles.callItem, { opacity: 0.2 }]
              : styles.callItem
          }
          key={callItem.id}
          onPress={() => {
            setCall(callItem);
          }}
        >
          <Text style={styles.title}>{callItem.data?.custom.title}</Text>
          <Text style={styles.subTitle}>
            {callItem.data?.custom.description}
          </Text>
        </Pressable>
      );
    },
    [setCall],
  );

  const renderFooter: RoomFlatList['ListFooterComponent'] = useCallback(() => {
    if (!nextPage.current) {
      return null;
    }
    return loadingCalls ? (
      <ActivityIndicator size={'small'} style={styles.activityIndicator} />
    ) : (
      <Button onPress={queryLiveCalls} title={t('Load more')} />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCalls, queryLiveCalls]);

  const renderEmpty: RoomFlatList['ListEmptyComponent'] = useCallback(() => {
    let text = 'No live audio rooms found';
    if (loadingCalls) {
      text = 'Loading...';
    } else if (loadingError) {
      text = 'Error loading calls';
    }
    return <Text style={[styles.emptyListText, styles.title]}>{text}</Text>;
  }, [loadingCalls, loadingError]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CreateRoomModal
        modalVisible={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        setCall={setCall}
      />
      <FlatList
        data={calls}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
      />
      <Pressable
        style={styles.fab}
        onPress={() => setShowCreateRoomModal(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    textAlignVertical: 'center',
  },
  fab: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  emptyListText: {
    textAlign: 'center',
  },
  title: {
    color: 'black',
    fontSize: 20,
    fontWeight: '500',
  },
  subTitle: {
    color: 'black',
    fontSize: 16,
    marginTop: 2,
  },
  button: {
    margin: appTheme.spacing.sm,
  },
  activityIndicator: {
    paddingVertical: appTheme.spacing.sm,
  },
  callItem: {
    padding: appTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
});

export default RoomList;
