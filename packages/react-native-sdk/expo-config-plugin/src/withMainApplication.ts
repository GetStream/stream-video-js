import { type ConfigPlugin, withMainApplication } from '@expo/config-plugins';
import {
  addImports,
  appendContentsInsideDeclarationBlock,
} from '@expo/config-plugins/build/android/codeMod';
import { type ConfigProps } from './common/types';

const withStreamVideoReactNativeSDKMainApplication: ConfigPlugin<
  ConfigProps
> = (configuration, props) => {
  return withMainApplication(configuration, (config) => {
    if (props?.addNoiseCancellation) {
      if (config.modResults.language !== 'kt') {
        throw new Error(
          `Cannot setup StreamVideoReactNativeSDK: a Kotlin MainApplication is required (the default since Expo SDK 50), found ${config.modResults.language}`,
        );
      }
      config.modResults.contents = addImports(
        config.modResults.contents,
        ['io.getstream.rn.noisecancellation.NoiseCancellationReactNative'],
        false,
      );
      config.modResults.contents = addNoiseCancellationInsideOnCreate(
        config.modResults.contents,
      );
    }

    return config;
  });
};

function addNoiseCancellationInsideOnCreate(contents: string) {
  const addBlock = `NoiseCancellationReactNative.registerProcessor(applicationContext)`;
  if (!contents.includes(addBlock)) {
    contents = appendContentsInsideDeclarationBlock(
      contents,
      'onCreate',
      addBlock + '\n',
    );
  }
  return contents;
}

export default withStreamVideoReactNativeSDKMainApplication;
