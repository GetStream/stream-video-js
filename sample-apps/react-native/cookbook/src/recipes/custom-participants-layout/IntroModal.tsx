import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import React, {useState} from 'react';
// @ts-ignore
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';
import PressMe from '../../components/PressMe';

export default ({callId}: {callId: string}) => {
  const [isIntroModalVisible, setIsIntroModalVisible] = useState(true);

  return (
    <Modal
      presentationStyle={'overFullScreen'}
      visible={isIntroModalVisible}
      animationType="slide"
      onRequestClose={() => setIsIntroModalVisible(false)}
      transparent>
      <View style={styles.modalWrapper}>
        <View style={styles.modalContainer}>
          <Text style={styles.medSizedText}>
            Your call has just started. To check the full implementation, please
            join the call from another device
          </Text>
          <Text style={[styles.margined, styles.boldText]}>
            Your call ID: {callId}
          </Text>
          <PressMe
            style={styles.margined}
            onPress={() =>
              openURLInBrowser(
                `https://stream-calls-dogfood.vercel.app/join/${callId}`,
              )
            }
            text={
              '🧑‍💻️ Click here to join the call with more participants via a web browser'
            }
          />
          <PressMe
            style={styles.margined}
            onPress={() =>
              openURLInBrowser(
                'https://github.com/GetStream/stream-video-buddy',
              )
            }
            text={'⌨️ Click here to join via Stream Video Buddy CLI'}
          />
          <Pressable
            style={[styles.margined, styles.flexEnded]}
            onPress={() => setIsIntroModalVisible(false)}>
            <Text>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  modalContainer: {
    justifyContent: 'center',
    padding: 16,
    marginTop: 50,
    marginHorizontal: 16,
    backgroundColor: 'rgba(13,150,236,0.4)',
    borderRadius: 8,
  },
  medSizedText: {fontSize: 16},
  boldText: {fontWeight: 'bold'},
  margined: {marginTop: 16},
  flexEnded: {alignSelf: 'flex-end'},
});
