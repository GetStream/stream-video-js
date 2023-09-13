import { ConfigPlugin, withMainApplication } from '@expo/config-plugins';
import {
  addImports,
  appendContentsInsideDeclarationBlock,
} from '@expo/config-plugins/build/android/codeMod';

const withStreamVideoReactNativeSDKMainApplication: ConfigPlugin = (
  configuration,
) => {
  return withMainApplication(configuration, (config) => {
    if (['java', 'kt'].includes(config.modResults.language)) {
      try {
        config.modResults.contents = addImports(
          config.modResults.contents,
          ['com.streamvideo.reactnative.StreamVideoReactNative'],
          config.modResults.language === 'java',
        );
        const statementToInsert = 'StreamVideoReactNative.setup();\n';
        if (!config.modResults.contents.includes(statementToInsert)) {
          config.modResults.contents = appendContentsInsideDeclarationBlock(
            config.modResults.contents,
            'onCreate',
            statementToInsert,
          );
        }
      } catch (error: any) {
        throw new Error(
          "Cannot add StreamVideoReactNativeSDK to the project's MainApplication because it's malformed.",
        );
      }
    } else {
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the MainApplication is not in Java/Kotlin',
      );
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKMainApplication;
