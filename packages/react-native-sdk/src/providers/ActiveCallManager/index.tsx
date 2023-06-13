import React from 'react';
import { useAndroidKeepCallAliveEffect } from '../../hooks';
import { useProcessPushCallEffect } from './useProcessPushCallEffect';

/**
 * A renderless component that does two things
 * 1. keeps the call alive in background in Android
 * 2. processes the incoming call push notification
 * This component must be a child of StreamVideo
 * @internal
 */
export const ActiveCallManager = (): React.ReactElement | null => {
  useAndroidKeepCallAliveEffect();
  useProcessPushCallEffect();

  return null;
};
