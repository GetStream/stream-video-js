export type InCallManagerType =
  typeof import('react-native-incall-manager').default;

let incallManager: InCallManagerType;

try {
  incallManager = require('react-native-incall-manager').default;
} catch (error) {}

export function getRNIncallManagerLib() {
  if (!incallManager) {
    console.log(
      'react-native-incall-manager library is not installed. Please see https://github.com/react-native-webrtc/react-native-incall-manager for installation instructions',
    );
  }
  return incallManager;
}
