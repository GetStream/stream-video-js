import {
  OwnCapability,
  PermissionRequestEvent,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { useAppI18n } from '../../hooks/useAppI18n';
import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

export const PermissionRequestsPanel = () => {
  const call = useCall();
  const { t } = useAppI18n();

  const { useHasPermissions } = useCallStateHooks();
  const canUpdatePermissions = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );
  const [speakingRequests, setSpeakingRequests] = useState<
    PermissionRequestEvent[]
  >([]);

  const handlePermissionRequest = async (
    request: PermissionRequestEvent,
    approve: boolean,
  ) => {
    const { user, permissions } = request;
    try {
      if (approve) {
        await call?.grantPermissions(user.id, permissions);
      } else {
        await call?.revokePermissions(user.id, permissions);
      }
      setSpeakingRequests((reqs) => reqs.filter((req) => req !== request));
    } catch (err) {
      console.error('Error granting or revoking permissions', err);
    }
  };

  useEffect(() => {
    if (!(call && canUpdatePermissions)) {
      return;
    }
    return call.on('call.permission_request', (event) => {
      setSpeakingRequests((prevSpeakingRequests) => [
        ...prevSpeakingRequests,
        event,
      ]);
    });
  }, [call, canUpdatePermissions]);

  if (!canUpdatePermissions || !speakingRequests.length) {
    return null;
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {speakingRequests.map((request) => (
        <View style={styles.itemContainer} key={request.user.id}>
          <Text style={styles.text} numberOfLines={2} ellipsizeMode="tail">
            {t(
              'permissionRequests.request.text',
              '{{ user }} requested to {{ permissions }}',
              {
                user: request.user.name,
                permissions: request.permissions.join(','),
              },
            )}
          </Text>
          <Button
            title={t('permissionRequests.approve.label', 'Approve')}
            onPress={() => handlePermissionRequest(request, true)}
          />
          <Button
            title={t('permissionRequests.deny.label', 'Deny')}
            onPress={() => handlePermissionRequest(request, false)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    width: '100%',
    maxHeight: 60,
  },
  text: {
    flexShrink: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
});
