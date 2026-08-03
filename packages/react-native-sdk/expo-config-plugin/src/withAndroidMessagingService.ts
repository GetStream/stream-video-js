import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import { type ConfigProps } from './common/types';

const GENERATED_SERVICE_CLASS_NAME = 'StreamVideoMessagingService';
const STREAM_DEFAULT_SERVICE =
  'io.getstream.rn.callingx.StreamMessagingService';
/** React Native Firebase's own FCM service. */
const RN_FIREBASE_SERVICE =
  'io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService';
/** expo-notifications' FCM service — the default base auto-detected when installed. */
const EXPO_NOTIFICATIONS_SERVICE =
  'expo.modules.notifications.service.ExpoFirebaseMessagingService';
const EXPO_NOTIFICATIONS_PACKAGE = 'expo-notifications';

const MESSAGING_EVENT_ACTION = 'com.google.firebase.MESSAGING_EVENT';
/**
 * The generated service lives in the `:app` module, which only has
 * firebase-messaging on its *runtime* classpath (via callingx / RNFB /
 * expo-notifications `implementation` deps). We add it as `compileOnly` so the
 * app can compile a `FirebaseMessagingService` subclass. The runtime artifact is
 * still supplied by those modules, so this avoids a version conflict.
 */
const FIREBASE_MESSAGING_ARTIFACT = 'com.google.firebase:firebase-messaging';
/**
 * Fallback Firebase BOM version, used only when the live BOM cannot be resolved
 * from @react-native-firebase/app. This is the BOM shipped by the minimum RNFB
 * version we support: @stream-io/react-native-callingx declares a
 * `@react-native-firebase/* >= 23.0.0` peer dependency, and RNFB `23.0.0` pins
 * firebase-bom `34.0.0`. Keep in sync with that peer floor.
 */
const FIREBASE_BOM_FALLBACK_VERSION = '34.0.0';
/** Stable comment used to detect (and avoid duplicating) our gradle injection. */
const FIREBASE_DEP_MARKER =
  '// Added by @stream-io/video-react-native-sdk for the generated FCM messaging service';

type ManifestService = NonNullable<
  AndroidConfig.Manifest.ManifestApplication['service']
>[number];

function getAndroidPackage(config: {
  android?: { package?: string };
  modResults?: unknown;
}): string {
  const modResults = config.modResults as
    | AndroidConfig.Manifest.AndroidManifest
    | undefined;
  const pkg = config.android?.package ?? modResults?.manifest?.$?.package;
  if (!pkg) {
    throw new Error(
      '[StreamVideo] Unable to resolve the Android package name required to generate ' +
        'the FCM messaging service. Set "android.package" in your app config.',
    );
  }
  return pkg;
}

function getGeneratedServiceFqcn(androidPackage: string): string {
  return `${androidPackage}.${GENERATED_SERVICE_CLASS_NAME}`;
}

function validateBaseClass(baseClass: string): void {
  if (typeof baseClass !== 'string' || baseClass.trim().length === 0) {
    throw new Error(
      '[StreamVideo] "androidMessagingServiceBaseClass" must be a non-empty string.',
    );
  }
  if (!baseClass.includes('.')) {
    throw new Error(
      `[StreamVideo] "androidMessagingServiceBaseClass" must be a fully-qualified class name ` +
        `including its package (e.g. "expo.modules.notifications.service.ExpoFirebaseMessagingService"), ` +
        `received "${baseClass}".`,
    );
  }
}

function isExpoNotificationsInstalled(projectRoot?: string): boolean {
  return isPackageUsedByApp(EXPO_NOTIFICATIONS_PACKAGE, projectRoot);
}

/**
 * Whether `packageName` belongs to this app's own dependency graph.
 *
 * Deliberately avoids `require.resolve`, which walks up the directory tree: in a
 * workspace that also finds packages hoisted to the repo root by a *sibling*
 * app. Those are not linked into this app's Android build, so extending their
 * service generates Kotlin that cannot compile.
 */
function isPackageUsedByApp(
  packageName: string,
  projectRoot?: string,
): boolean {
  if (!projectRoot) {
    // No project context to scope the lookup to; plain resolution is all we have.
    try {
      require.resolve(`${packageName}/package.json`);
      return true;
    } catch {
      return false;
    }
  }

  try {
    const appPackageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
    );
    // Only runtime dependencies: a devDependency is not linked into the build.
    if (packageName in { ...appPackageJson?.dependencies }) {
      return true;
    }
  } catch {
    // Unreadable app package.json: fall through to the filesystem check.
  }

  return fs.existsSync(
    path.join(projectRoot, 'node_modules', packageName, 'package.json'),
  );
}

function resolveBaseClass(
  value: string | null | undefined,
  projectRoot?: string,
): string | undefined {
  if (value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    validateBaseClass(value);
    return value;
  }
  return isExpoNotificationsInstalled(projectRoot)
    ? EXPO_NOTIFICATIONS_SERVICE
    : undefined;
}

/** Kotlin source for the generated messaging service. */
function buildServiceSource(
  androidPackage: string,
  baseClassFqcn: string,
): string {
  const simpleName = baseClassFqcn.split('.').pop();

  const shouldForwardNewToken = baseClassFqcn !== RN_FIREBASE_SERVICE;
  const onNewToken = shouldForwardNewToken
    ? `
  override fun onNewToken(token: String) {
    super.onNewToken(token)
    // Keep Stream's device registration working under a non-RNFirebase base.
    StreamMessagingHelper.forwardNewToken(token)
  }
`
    : '';

  return `package ${androidPackage}

import android.annotation.SuppressLint
import com.google.firebase.messaging.RemoteMessage
import io.getstream.rn.callingx.StreamMessagingHelper
import ${baseClassFqcn}

/**
 * AUTO-GENERATED by the @stream-io/video-react-native-sdk Expo config plugin.
 * Do not edit — this file is regenerated on every \`expo prebuild\`.
 *
 * Extends the app-declared FCM service (${baseClassFqcn}) and injects Stream
 * Video incoming-call (\`call.ring\`) handling. Stream's default
 * ${STREAM_DEFAULT_SERVICE} is removed from the merged manifest so this class is
 * the single FirebaseMessagingService for the app.
 */
@SuppressLint("MissingFirebaseInstanceTokenRefresh")
class ${GENERATED_SERVICE_CLASS_NAME} : ${simpleName}() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    if (StreamMessagingHelper.isStreamCallRing(remoteMessage)) {
      StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)
      return
    }
    super.onMessageReceived(remoteMessage)
  }
${onNewToken}}
`;
}

function updateManifest(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  generatedFqcn: string,
  baseClassFqcn: string,
): AndroidConfig.Manifest.AndroidManifest {
  const manifest = androidManifest.manifest;
  if (
    !manifest ||
    !Array.isArray(manifest.application) ||
    !manifest.application[0]
  ) {
    throw new Error(
      '[StreamVideo] Malformed AndroidManifest.xml: missing <application> element.',
    );
  }

  manifest.$ = manifest.$ ?? {};
  manifest.$['xmlns:tools'] =
    manifest.$['xmlns:tools'] ?? 'http://schemas.android.com/tools';

  // Services whose registration we strip so the generated service is the only
  // MESSAGING_EVENT handler: Stream's default (from react-native-callingx) and
  // the base class (its logic still runs — the generated service subclasses it).
  const servicesToRemove = [
    ...new Set([STREAM_DEFAULT_SERVICE, baseClassFqcn]),
  ];

  const application = manifest.application[0];
  const existing = application.service ?? [];

  // Drop our own previously-added entries so re-runs don't duplicate them.
  const services = existing.filter((service) => {
    const name = service?.$?.['android:name'];
    return name !== generatedFqcn && !servicesToRemove.includes(name ?? '');
  });

  // The generated service becomes the single com.google.firebase.MESSAGING_EVENT handler.
  services.push({
    $: {
      'android:name': generatedFqcn,
      'android:exported': 'false',
    },
    'intent-filter': [
      {
        action: [{ $: { 'android:name': MESSAGING_EVENT_ACTION } }],
      },
    ],
  } as unknown as ManifestService);

  // Remove the competing services so they don't win FCM delivery. `tools:node`
  // is not part of the strict typing but is valid manifest merger syntax.
  for (const name of servicesToRemove) {
    services.push({
      $: {
        'android:name': name,
        'tools:node': 'remove',
      },
    } as unknown as ManifestService);
  }

  application.service = services;
  return androidManifest;
}

const withGeneratedMessagingServiceFile: ConfigPlugin<
  string | null | undefined
> = (config, value) => {
  return withDangerousMod(config, [
    'android',
    (dangerousConfig) => {
      const baseClassFqcn = resolveBaseClass(
        value,
        dangerousConfig.modRequest.projectRoot,
      );
      if (!baseClassFqcn) {
        return dangerousConfig;
      }
      const androidPackage = getAndroidPackage(dangerousConfig);
      const packagePath = androidPackage.replace(/\./g, path.sep);
      const javaDir = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        packagePath,
      );
      fs.mkdirSync(javaDir, { recursive: true });

      const destPath = path.join(javaDir, `${GENERATED_SERVICE_CLASS_NAME}.kt`);
      fs.writeFileSync(
        destPath,
        buildServiceSource(androidPackage, baseClassFqcn),
        'utf8',
      );

      return dangerousConfig;
    },
  ]);
};

const withMessagingServiceManifest: ConfigPlugin<string | null | undefined> = (
  config,
  value,
) => {
  return withAndroidManifest(config, (androidConfig) => {
    const baseClassFqcn = resolveBaseClass(
      value,
      androidConfig.modRequest.projectRoot,
    );
    if (!baseClassFqcn) {
      return androidConfig;
    }
    const androidPackage = getAndroidPackage(androidConfig);
    androidConfig.modResults = updateManifest(
      androidConfig.modResults,
      getGeneratedServiceFqcn(androidPackage),
      baseClassFqcn,
    );
    return androidConfig;
  });
};

function resolveFirebaseBomVersion(projectRoot?: string): string | undefined {
  try {
    const pkgPath = require.resolve(
      '@react-native-firebase/app/package.json',
      projectRoot ? { paths: [projectRoot] } : undefined,
    );
    const pkg = require(pkgPath);
    const bom = pkg?.sdkVersions?.android?.firebase;
    return typeof bom === 'string' && bom.length > 0 ? bom : undefined;
  } catch {
    return undefined;
  }
}

const DEPENDENCIES_BLOCK = /dependencies\s*\{/;

function addFirebaseMessagingDependency(
  contents: string,
  bomVersion?: string,
): string {
  if (contents.includes(FIREBASE_DEP_MARKER)) {
    return contents;
  }

  if (!DEPENDENCIES_BLOCK.test(contents)) {
    throw new Error(
      '[StreamVideo] Could not find a "dependencies { }" block in the app build.gradle ' +
        'to add the firebase-messaging compile dependency for the generated FCM service.',
    );
  }

  const lines =
    `    ${FIREBASE_DEP_MARKER}\n` +
    `    compileOnly(platform("com.google.firebase:firebase-bom:${
      bomVersion ?? FIREBASE_BOM_FALLBACK_VERSION
    }"))\n` +
    `    compileOnly("${FIREBASE_MESSAGING_ARTIFACT}")`;
  return contents.replace(DEPENDENCIES_BLOCK, (match) => `${match}\n${lines}`);
}

const withMessagingServiceGradle: ConfigPlugin<string | null | undefined> = (
  config,
  value,
) => {
  return withAppBuildGradle(config, (gradleConfig) => {
    const baseClassFqcn = resolveBaseClass(
      value,
      gradleConfig.modRequest.projectRoot,
    );
    if (!baseClassFqcn) {
      return gradleConfig;
    }
    const bomVersion = resolveFirebaseBomVersion(
      gradleConfig.modRequest.projectRoot,
    );
    gradleConfig.modResults.contents = addFirebaseMessagingDependency(
      gradleConfig.modResults.contents,
      bomVersion,
    );
    return gradleConfig;
  });
};

const withAndroidMessagingService: ConfigPlugin<ConfigProps> = (
  config,
  props,
) => {
  // The messaging-service override only matters for the ringing flow, skip it otherwise.
  if (!props?.ringing) {
    return config;
  }

  const value = props?.androidMessagingServiceBaseClass;

  let updated = withGeneratedMessagingServiceFile(config, value);
  updated = withMessagingServiceManifest(updated, value);
  updated = withMessagingServiceGradle(updated, value);
  return updated;
};

export default withAndroidMessagingService;
export {
  updateManifest,
  buildServiceSource,
  validateBaseClass,
  resolveBaseClass,
  isExpoNotificationsInstalled,
  getGeneratedServiceFqcn,
  addFirebaseMessagingDependency,
  resolveFirebaseBomVersion,
  EXPO_NOTIFICATIONS_SERVICE,
  GENERATED_SERVICE_CLASS_NAME,
  STREAM_DEFAULT_SERVICE,
  FIREBASE_MESSAGING_ARTIFACT,
  FIREBASE_BOM_FALLBACK_VERSION,
  FIREBASE_DEP_MARKER,
};
