import {
  OwnCapability,
  PermissionRequestEvent,
  useCall,
  useCallMetadata,
  useHasPermissions,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useState } from 'react';
import { Text, Button, ScrollView, StyleSheet, View } from 'react-native';

export const SpeakingPermissionsRequestButtonsList = () => {
  const call = useCall();
  const metadata = useCallMetadata();
  const canUpdatePermissions = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );
  const [speakingRequests, setSpeakingRequests] = useState<
    PermissionRequestEvent[]
  >([]);

  function dismissRequest(speakingRequest: PermissionRequestEvent) {
    const newRequests = speakingRequests.filter(
      (r) => r.user.id !== speakingRequest.user.id,
    );
    setSpeakingRequests(newRequests);
  }

  const acceptRequest = async (speakingRequest: PermissionRequestEvent) => {
    if (!(call && metadata?.custom)) {
      return null;
    }

    await call?.updateUserPermissions({
      user_id: speakingRequest.user.id,
      grant_permissions: [...speakingRequest.permissions],
    });
    dismissRequest(speakingRequest);
  };

  useEffect(() => {
    if (!(call && canUpdatePermissions)) {
      return;
    }
    return call.on('call.permission_request', (event) => {
      if (event.type !== 'call.permission_request') {
        return;
      }
      setSpeakingRequests((prevSpeakingRequests) => [
        ...prevSpeakingRequests,
        event,
      ]);
    });
  }, [call, canUpdatePermissions]);

  if (!canUpdatePermissions || !speakingRequests.length) {
    return null;
  }
  <ScrollView style={styles.scrollContainer}>
    {speakingRequests.map((request) => (
      <View key={request.user.id} style={styles.itemContainer}>
        <Text>
          {`${request.user.name} requested to ${request.permissions.join(',')}`}
        </Text>
        <Button title="Accept" onPress={() => acceptRequest(request)} />
        <Button title="Dismiss" onPress={() => dismissRequest(request)} />
      </View>
    ))}
  </ScrollView>;
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: 40,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 20,
  },
});
