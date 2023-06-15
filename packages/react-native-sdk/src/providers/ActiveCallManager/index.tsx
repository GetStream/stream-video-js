import React from 'react';
import { useAndroidKeepCallAliveEffect } from '../../hooks';

/**
 * A renderless component that does two things
 * 1. keeps the call alive in background in Android
 * 2. processes the incoming call push notification
 * This component must be a child of StreamCallProvider
 * @internal
 */
export const ActiveCallManager = (): React.ReactElement | null => {
  useAndroidKeepCallAliveEffect();

  return null;
};
