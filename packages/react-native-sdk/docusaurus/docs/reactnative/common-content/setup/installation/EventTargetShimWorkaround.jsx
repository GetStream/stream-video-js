import React from 'react';
import CodeBlock from '@theme/CodeBlock';

const forExpo = `const {getDefaultConfig} = require('expo/metro-config');
const resolveFrom = require("resolve-from");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    // If the bundle is resolving "event-target-shim" from a module that is part of "react-native-webrtc".
    moduleName.startsWith("event-target-shim") &&
    context.originModulePath.includes("react-native-webrtc")
  ) {
    // Resolve event-target-shim relative to the react-native-webrtc package to use v6.
    // React Native requires v5 which is not compatible with react-native-webrtc.
    const eventTargetShimPath = resolveFrom(
      context.originModulePath,
      moduleName
    );

    return {
      filePath: eventTargetShimPath,
      type: "sourceFile",
    };
  }

  // Ensure you call the default resolver.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
`;

const forVanilla = `const {getDefaultConfig} = require('@react-native/metro-config');
const resolveFrom = require("resolve-from");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    // If the bundle is resolving "event-target-shim" from a module that is part of "react-native-webrtc".
    moduleName.startsWith("event-target-shim") &&
    context.originModulePath.includes("react-native-webrtc")
  ) {
    // Resolve event-target-shim relative to the react-native-webrtc package to use v6.
    // React Native requires v5 which is not compatible with react-native-webrtc.
    const eventTargetShimPath = resolveFrom(
      context.originModulePath,
      moduleName
    );

    return {
      filePath: eventTargetShimPath,
      type: "sourceFile",
    };
  }

  // Ensure you call the default resolver.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
`;

export default function Workaround({ isExpo }) {
  if (isExpo) {
    return (
      <>
        <p>
          This occurs on Expo 50+. React Native uses{' '}
          <code>event-target-shim@5</code> which is not compatible with{' '}
          <code>react-native-webrtc</code>'s dependency on{' '}
          <code>event-target-shim@6</code>. To fix this, you may need to add a{' '}
          redirection in your <code>metro.config.js</code> file:
        </p>
        <CodeBlock language="ts">{forExpo}</CodeBlock>
      </>
    );
  }

  return (
    <>
      <p>
        This occurs on RN 0.73+. React Native uses{' '}
        <code>event-target-shim@5</code> which is not compatible with{' '}
        <code>react-native-webrtc</code>'s dependency on{' '}
        <code>event-target-shim@6</code>. To fix this, you may need to add a{' '}
        redirection in your <code>metro.config.js</code> file:
      </p>
      <CodeBlock language="ts">{forVanilla}</CodeBlock>
    </>
  );
}
