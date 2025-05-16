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
    const isMainActivityJava = config.modResults.language === 'java';

    if (props?.enableNoiseCancellation) {
      config.modResults.contents = addImports(
        config.modResults.contents,
        ['io.getstream.rn.noisecancellation.NoiseCancellationReactNative'],
        isMainActivityJava,
      );
      config.modResults.contents = addNoiseCancellationInsideOnCreate(
        config.modResults.contents,
        isMainActivityJava,
      );
    }

    return config;
  });
};

function addNoiseCancellationInsideOnCreate(contents: string, isJava: boolean) {
  const addBlock = isJava
    ? `NoiseCancellationReactNative.registerProcessor(getApplicationContext());`
    : `NoiseCancellationReactNative.registerProcessor(applicationContext)`;
  if (!contents.includes(addBlock)) {
    contents = appendContentsInsideDeclarationBlock(
      contents,
      'onCreate',
      addBlock,
    );
  }
  return contents;
}

export default withStreamVideoReactNativeSDKMainApplication;
