import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatListProps, Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme';
import { Button } from '../../components/Button';
import { Call, useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { FlatList } from 'react-native';
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
  // holds the cursor to the next page of calls
  const nextPage = useRef<string>();

  const queryLiveCalls = useCallback(async () => {
    if (!client || client.user?.id === undefined) {
      return;
    }
    setLoadingCalls(true);
    setLoadingError(undefined);
    // get all the live calls
    try {
      const filterForJoinableCalls = {
        type: 'audio_room',
        ended_at: null,
        $or: [
          {
            backstage: true,
            created_by_user_id: client.user.id,
          },
          {
            backstage: true,
            members: { $in: [client.user?.id] },
          },
          {
            backstage: false,
          },
        ],
      };
      const result = await client.queryCalls({
        filter_conditions: filterForJoinableCalls,
        sort: [{ field: 'created_at', direction: -1 }],
        limit: 10,
        next: nextPage.current,
      });
      nextPage.current = result.next;
      setCalls((prev) => [
        ...prev,
        ...result.calls,
        // ...result.calls.filter(
        //   (c) => c.data?.custom?.title && c.data.custom?.description,
        // ),
      ]);
    } catch (e) {
      if (e instanceof Error) {
        setLoadingError(e);
      }
    } finally {
      setLoadingCalls(false);
    }
  }, [client]);

  // query live calls on initial render
  const initialRunDoneRef = useRef(false);
  useEffect(() => {
    if (!initialRunDoneRef.current) {
      initialRunDoneRef.current = true;
      queryLiveCalls();
      return;
    }
  }, [queryLiveCalls]);

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
            callItem.get();
            setCall(callItem);
          }}
        >
          <Text style={styles.title}>
            {callItem.data?.custom.title ?? callItem.id}
          </Text>
          <Text style={styles.subTitle}>
            {callItem.data?.custom.description ?? 'no description'}
          </Text>
        </Pressable>
      );
    },
    [setCall],
  );

  const renderFooter: RoomFlatList['ListFooterComponent'] = useCallback(
    () =>
      nextPage.current ? (
        <Button
          onPress={queryLiveCalls}
          title="Load more"
          buttonStyle={styles.button}
        />
      ) : null,
    [queryLiveCalls],
  );

  const renderEmpty: RoomFlatList['ListEmptyComponent'] = useCallback(
    () => (
      <Text style={[styles.emptyListText, styles.title]}>
        {'No live audio rooms found'}
      </Text>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CreateRoomModal
        modalVisible={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        setCall={setCall}
      />
      <FlatList
        data={calls}
        bounces={false}
        ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
      />
      <Pressable
        style={styles.fab}
        onPress={() => setShowCreateRoomModal(true)}
      >
        <Text style={styles.title}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingVertical: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.static_grey,
    flex: 1,
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
    fontSize: 20,
    color: appTheme.colors.static_white,
    fontWeight: '500',
  },
  subTitle: {
    color: appTheme.colors.light_gray,
    fontSize: 16,
    marginTop: 2,
  },
  button: {
    margin: appTheme.spacing.sm,
  },
  callItem: {
    padding: appTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.static_white,
  },
});

export default RoomList;
