import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { View } from 'react-native';
import { defaultTheme } from '@stream-io/video-react-native-sdk';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';

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
        title={'Switch Environment'}
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
        title={`Polling: ${disableRingStatePolling ? 'off' : 'on'}`}
        buttonStyle={[
          styles.modalButton,
          disableRingStatePolling
            ? styles.unselectedModalButton
            : styles.selectedModalButton,
        ]}
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
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const useLocalSfuState = useAppGlobalStoreValue((store) => store.useLocalSfu);
  const setState = useAppGlobalStoreSetState();
  const isSelected =
    appEnvironment === environment && useLocalSfuState === useLocalSfu;
  const onPress = () => {
    setState({ appEnvironment: environment, useLocalSfu });
  };

  return (
    <>
      <Button
        title={label}
        buttonStyle={[
          styles.modalButton,
          isSelected
            ? styles.selectedModalButton
            : styles.unselectedModalButton,
        ]}
        onPress={() => {
          onPress();
          closeModal();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: defaultTheme.colors.sheetOverlay,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modalView: {
    backgroundColor: defaultTheme.colors.sheetTertiary,
    borderRadius: 20,
    padding: defaultTheme.variants.spacingSizes.md,
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
    margin: defaultTheme.variants.spacingSizes.sm,
  },
  selectedModalButton: {
    borderWidth: 4,
    borderColor: defaultTheme.colors.iconPrimary,
  },
  unselectedModalButton: {
    borderWidth: 4,
    borderColor: 'transparent',
  },
  modalHeaderText: {
    color: defaultTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalText: {
    fontSize: 20,
  },
  modalSectionText: {
    color: defaultTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: defaultTheme.variants.spacingSizes.md,
    marginHorizontal: defaultTheme.variants.spacingSizes.sm,
  },
  modalInput: {
    // the shared input is `flex: 1`, which would stretch it in this column
    flex: 0,
    minWidth: 260,
    marginHorizontal: defaultTheme.variants.spacingSizes.sm,
  },
});
