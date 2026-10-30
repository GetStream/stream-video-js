import { execFileSync } from 'child_process';

export const bundleId = 'io.getstream.video.reactnative.e2etestapp';

/**
 * Grants camera and microphone access, like `grantAppPermissions()` in the Android suite.
 *
 * - iOS: `simctl privacy`. Detox's `launchApp({ permissions })` would do it through
 *   `applesimutils --restartSB`, restarting SpringBoard on every launch (minutes per test on CI).
 * - Android: nothing to do. Detox installs the app with `adb install -g`, which grants every runtime
 *   permission in the manifest.
 */
export const grantAppPermissions = () => {
  if (device.getPlatform() !== 'ios') {
    return;
  }
  for (const service of ['camera', 'microphone']) {
    execFileSync('xcrun', [
      'simctl',
      'privacy',
      device.id,
      'grant',
      service,
      bundleId,
    ]);
  }
};
