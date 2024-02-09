import React from 'react';
import CodeBlock from '@theme/CodeBlock';

const forExpo = `const config = {
  expo: {
    // ...
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            extraMavenRepos: ['../../node_modules/@notifee/react-native/android/libs'],
          }
        },
      ],
    ],
  },
};
`;

const forVanilla = `allprojects {
  repositories {
    maven { url '../../node_modules/@notifee/react-native/android/libs' }
  }
}
`;

export default function NotifeeWorkaround({ isExpo }) {
  if (isExpo) {
    return (
      <>
        <p>
          This occurs on Expo 49+ with a monorepo configuration. Notifee is
          unable to find the compiled AAR android library. You can do the
          following workaround in your <code>app.json</code> to mitigate this:
        </p>
        <CodeBlock language="ts">{forExpo}</CodeBlock>
        <p>
          This will add the Notifee library to the list of repositories that
          Gradle will search for dependencies. Please note that the exact path
          for <strong>extraMavenRepos</strong> will vary depending on your
          project's structure.
        </p>
      </>
    );
  }
  return (
    <>
      <p>
        This occurs projects with a monorepo configuration. Notifee is unable to
        find the compiled AAR android library. You can do the following
        workaround in your <code>android/build.gradle</code> to mitigate this:
      </p>
      <CodeBlock language="ts">{forVanilla}</CodeBlock>
      <p>
        This will add the Notifee library to the list of repositories that
        Gradle will search for dependencies. Please note that the exact path
        will vary depending on your project's structure.
      </p>
    </>
  );
}
