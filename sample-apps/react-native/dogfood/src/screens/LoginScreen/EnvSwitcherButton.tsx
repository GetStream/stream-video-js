import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { View } from 'react-native';
import { Button } from '@stream-io/video-react-native-sdk/src/components';
import { useTheme } from '@stream-io/video-react-native-sdk';

const appEnvironments: AppEnvironment[] = [
  'pronto',
  'video-moderation',
  'demo',
  'pronto-staging',
  'stream-benchmark',
];
export default function EnvSwitcherButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const closeModal = () => setModalVisible(false);
  const styles = useStyles();

  return (
    <>
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
        supportedOrientations={['portrait', 'landscape']}
      >
        <Pressable style={styles.centeredView} onPress={closeModal}>
          <View style={styles.modalView} onStartShouldSetResponder={() => true}>
            {appEnvironments.map((environment) => (
              <SwitcherButton
                key={environment}
                environment={environment}
                closeModal={closeModal}
              />
            ))}
            <SwitcherButton
              environment="pronto"
              label="Local SFU"
              closeModal={closeModal}
              useLocalSfu
            />
            <RingStateOptions />
          </View>
        </Pressable>
      </Modal>
      <Button
        style={{ alignSelf: 'flex-end' }}
        text={'Switch Environment'}
        onPress={() => {
          setModalVisible(true);
        }}
      />
    </>
  );
}

/**
 * Ring state options, used to dogfood the pollable ring state (VID-1444):
 * a coordinator override for reaching an edge that serves the `ring_state`
 * endpoint, and a switch to compare the ringing experience with polling off.
 *
 * Both are persisted, so the client created for a push in the background picks
 * them up too.
 */
const RingStateOptions = () => {
  const coordinatorBaseUrl = useAppGlobalStoreValue(
    (store) => store.coordinatorBaseUrl,
  );
  const disableRingStatePolling = useAppGlobalStoreValue(
    (store) => store.disableRingStatePolling,
  );
  const setState = useAppGlobalStoreSetState();
  const styles = useStyles();
  return (
    <>
      <Text style={styles.modalSectionText}>{'Ring state'}</Text>
      <TextInput
        placeholder={'Coordinator URL (blank = default)'}
        defaultValue={coordinatorBaseUrl}
        onEndEditing={(e) =>
          setState({ coordinatorBaseUrl: e.nativeEvent.text.trim() })
        }
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.modalInput}
      />
      <Button
        text={`Polling: ${disableRingStatePolling ? 'off' : 'on'}`}
        onPress={() =>
          setState({ disableRingStatePolling: !disableRingStatePolling })
        }
      />
    </>
  );
};

const SwitcherButton = ({
  environment,
  label = environment,
  closeModal,
  useLocalSfu = false,
}: {
  environment: AppEnvironment;
  label?: string;
  closeModal: () => void;
  useLocalSfu?: boolean;
}) => {
  const setState = useAppGlobalStoreSetState();
  const onPress = () => {
    setState({ appEnvironment: environment, useLocalSfu });
  };

  return (
    <>
      <Button
        text={label}
        onPress={() => {
          onPress();
          closeModal();
        }}
      />
    </>
  );
};

const useStyles = () => {
  const {
    theme: { semantics, primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        centeredView: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: semantics.backgroundCoreScrim,
        },
        row: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
        },
        modalView: {
          backgroundColor: semantics.backgroundCoreElevation2,
          borderRadius: 20,
          padding: 8,
          gap: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        },
        modalButton: {
          margin: 8,
        },
        selectedModalButton: {
          borderWidth: 4,
          borderColor: '#eff0f1',
        },
        unselectedModalButton: {
          borderWidth: 4,
          borderColor: 'transparent',
        },
        modalHeaderText: {
          color: '#eff0f1',
          fontSize: 24,
          fontWeight: 'bold',
          alignSelf: 'center',
          marginVertical: 8,
        },
        modalText: {
          fontSize: 20,
        },
        modalSectionText: {
          color: semantics.textPrimary,
          fontSize: 16,
          fontWeight: 'bold',
          marginTop: primitives.spacingMd,
          marginHorizontal: primitives.spacingSm,
        },
        modalInput: {
          // the shared input is `flex: 1`, which would stretch it in this column
          flex: 0,
          minWidth: 260,
          marginHorizontal: primitives.spacingSm,
        },
      }),
    [semantics, primitives],
  );
};
