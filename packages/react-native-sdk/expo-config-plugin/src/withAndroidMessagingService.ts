import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import { type ConfigProps } from './common/types';

const GENERATED_SERVICE_CLASS_NAME = 'StreamVideoMessagingService';
const STREAM_DEFAULT_SERVICE =
  'io.getstream.rn.callingx.StreamMessagingService';
/** expo-notifications' FCM service — auto-detected when the package is installed. */
const EXPO_NOTIFICATIONS_SERVICE =
  'expo.modules.notifications.service.ExpoFirebaseMessagingService';
const EXPO_NOTIFICATIONS_PACKAGE = 'expo-notifications';
/** @react-native-firebase/messaging's FCM service — auto-detected when the package is installed. */
const RNFIREBASE_MESSAGING_SERVICE =
  'io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService';
const RNFIREBASE_MESSAGING_PACKAGE = '@react-native-firebase/messaging';

/**
 * Third-party FCM services we always strip from the merged manifest when a base
 * class is chosen. Android delivers FCM messages to a single service; if any of
 * these is left declared alongside our generated service (both at priority 0)
 * the manifest merger picks non-deterministically. Stripping them all guarantees
 * our generated subclass is the only MESSAGING_EVENT handler — the chosen base
 * class's logic still runs via `super.onMessageReceived`, since we only remove
 * the manifest ENTRY, not the class itself from the classpath.
 *
 * A `tools:node="remove"` for a service that isn't declared in any lower-
 * priority manifest is a harmless no-op, so listing everything unconditionally
 * is safe.
 */
const KNOWN_FCM_COMPETITOR_SERVICES = [
  EXPO_NOTIFICATIONS_SERVICE,
  RNFIREBASE_MESSAGING_SERVICE,
];

const MESSAGING_EVENT_ACTION = 'com.google.firebase.MESSAGING_EVENT';

type ManifestService = NonNullable<
  AndroidConfig.Manifest.ManifestApplication['service']
>[number];

function getAndroidPackage(config: {
  android?: { package?: string };
  modResults?: unknown;
}): string {
  const modResults = config.modResults as
    AndroidConfig.Manifest.AndroidManifest | undefined;
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

function isRNFirebaseMessagingInstalled(projectRoot?: string): boolean {
  return isPackageUsedByApp(RNFIREBASE_MESSAGING_PACKAGE, projectRoot);
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
  // Auto-detect known FCM base classes when the consumer didn't specify one.
  // Order matters: if both are installed (unusual but possible), we silently
  // prefer expo-notifications. Consumers can override with an explicit
  // `androidMessagingServiceBaseClass` string.
  if (isExpoNotificationsInstalled(projectRoot)) {
    return EXPO_NOTIFICATIONS_SERVICE;
  }
  if (isRNFirebaseMessagingInstalled(projectRoot)) {
    return RNFIREBASE_MESSAGING_SERVICE;
  }
  return undefined;
}

/** Kotlin source for the generated messaging service. */
function buildServiceSource(
  androidPackage: string,
  baseClassFqcn: string,
): string {
  const simpleName = baseClassFqcn.split('.').pop();

  return `package ${androidPackage}

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
class ${GENERATED_SERVICE_CLASS_NAME} : ${simpleName}() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    if (StreamMessagingHelper.isStreamCallRing(remoteMessage)) {
      StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)
      return
    }
    super.onMessageReceived(remoteMessage)
  }

  override fun onNewToken(token: String) {
    super.onNewToken(token)
    // Forward the rotated FCM token to Stream so the SDK's device-registration flow runs.
    StreamMessagingHelper.forwardNewToken(token)
  }
}
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
  // MESSAGING_EVENT handler:
  //   1. Stream's default (from react-native-callingx).
  //   2. The chosen base class (its logic still runs via `super` — we only
  //      remove the manifest entry, not the class from the classpath).
  //   3. Every KNOWN_FCM_COMPETITOR_SERVICES entry, unconditionally. If a
  //      consumer has both expo-notifications and @react-native-firebase/messaging
  //      installed, whichever wasn't picked as the base would otherwise collide
  //      with our generated service at the manifest merge (both at priority 0).
  //      `tools:node="remove"` for a service that isn't declared elsewhere is a
  //      no-op, so this is safe for setups where the "other" competitor isn't
  //      installed.
  const servicesToRemove = [
    ...new Set([
      STREAM_DEFAULT_SERVICE,
      baseClassFqcn,
      ...KNOWN_FCM_COMPETITOR_SERVICES,
    ]),
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
  return updated;
};

export default withAndroidMessagingService;
export {
  updateManifest,
  buildServiceSource,
  validateBaseClass,
  resolveBaseClass,
  isExpoNotificationsInstalled,
  isRNFirebaseMessagingInstalled,
  getGeneratedServiceFqcn,
  EXPO_NOTIFICATIONS_SERVICE,
  RNFIREBASE_MESSAGING_SERVICE,
  GENERATED_SERVICE_CLASS_NAME,
  STREAM_DEFAULT_SERVICE,
};
