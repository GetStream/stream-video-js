/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 300000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      // `:app:` only: a bare assembleAndroidTest also builds the libraries' own test APKs, and
      // react-native-worklets' fails to dex.
      build:
        'cd android && ./gradlew assembleDebug :app:assembleAndroidTest -DtestBuildType=debug && cd ..',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      build:
        'cd android && ./gradlew assembleRelease :app:assembleAndroidTest -DtestBuildType=release && cd ..',
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: { avdName: process.env.DETOX_AVD_NAME || 'Pixel_API_37' },
    },
    attached: {
      type: 'android.attached',
      device: { adbName: process.env.DETOX_ADB_NAME || '.*' },
    },
  },
  configurations: {
    'android.emu.debug': { app: 'android.debug', device: 'emulator' },
    'android.emu.release': { app: 'android.release', device: 'emulator' },
    'android.att.debug': { app: 'android.debug', device: 'attached' },
    'android.att.release': { app: 'android.release', device: 'attached' },
  },
};
