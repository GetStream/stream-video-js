import { ConfigPlugin, withAppBuildGradle } from '@expo/config-plugins';

const withStreamVideoReactNativeBuildGradle: ConfigPlugin = (configuration) => {
  return withAppBuildGradle(configuration, (config) => {
    if (config.modResults.contents.includes('compileOptions')) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      'android {',
      `
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_11
    }`,
    );

    return config;
  });
};

export default withStreamVideoReactNativeBuildGradle;
