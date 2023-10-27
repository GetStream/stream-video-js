import { ConfigPlugin } from '@expo/config-plugins';
import { withBuildProperties } from 'expo-build-properties';

const withStreamVideoReactNativeBuildProperties: ConfigPlugin = (
  configuration,
) => {
  return withBuildProperties(configuration, {
    android: {
      extraProguardRules: `
-keep class org.webrtc.** { *; }
`,
    },
  });
};

export default withStreamVideoReactNativeBuildProperties;
