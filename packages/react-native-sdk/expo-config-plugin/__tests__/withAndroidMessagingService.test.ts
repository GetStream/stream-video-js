import { AndroidConfig } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import withAndroidMessagingService, {
  updateManifest,
  buildServiceSource,
  validateBaseClass,
  resolveBaseClass,
  isExpoNotificationsInstalled,
  isRNFirebaseMessagingInstalled,
  getGeneratedServiceFqcn,
  EXPO_NOTIFICATIONS_SERVICE,
  RNFIREBASE_MESSAGING_SERVICE,
  STREAM_DEFAULT_SERVICE,
} from '../src/withAndroidMessagingService';

type Manifest = AndroidConfig.Manifest.AndroidManifest;

const EXPO_BASE =
  'expo.modules.notifications.service.ExpoFirebaseMessagingService';
const APP_PACKAGE = 'io.getstream.expovideosample';

function emptyManifest(): Manifest {
  return {
    manifest: {
      $: {
        'xmlns:android': 'http://schemas.android.com/apk/res/android',
        package: APP_PACKAGE,
      },
      application: [{ $: {} }],
    },
  } as unknown as Manifest;
}

describe('validateBaseClass', () => {
  it('accepts a fully-qualified class name', () => {
    expect(() => validateBaseClass(EXPO_BASE)).not.toThrow();
  });

  it('throws on empty input', () => {
    expect(() => validateBaseClass('')).toThrow();
    expect(() => validateBaseClass('   ')).toThrow();
  });

  it('throws when the package is missing', () => {
    expect(() => validateBaseClass('ExpoFirebaseMessagingService')).toThrow();
  });
});

describe('resolveBaseClass', () => {
  it('returns undefined (opt out) when null is passed', () => {
    expect(resolveBaseClass(null)).toBeUndefined();
    // even when expo-notifications is installed in the monorepo
    expect(resolveBaseClass(null, process.cwd())).toBeUndefined();
  });

  it('returns the explicit class when a string is passed', () => {
    expect(resolveBaseClass(EXPO_BASE)).toBe(EXPO_BASE);
  });

  it('throws on an invalid explicit class', () => {
    expect(() => resolveBaseClass('NoPackageName')).toThrow();
  });

  it('auto-detects expo-notifications when omitted (installed)', () => {
    // expo-notifications is installed in the monorepo, resolvable from here
    expect(resolveBaseClass(undefined)).toBe(EXPO_NOTIFICATIONS_SERVICE);
  });

  it('returns undefined when omitted and expo-notifications is not resolvable', () => {
    expect(
      resolveBaseClass(undefined, '/definitely/not/a/real/path'),
    ).toBeUndefined();
  });

  const withTempProject = (
    files: Record<string, string>,
    assertion: (projectRoot: string) => void,
  ) => {
    const projectRoot = fs.mkdtempSync(path.join(tmpdir(), 'stream-plugin-'));
    try {
      for (const [relativePath, contents] of Object.entries(files)) {
        const target = path.join(projectRoot, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents);
      }
      assertion(projectRoot);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  };

  it('auto-detects @react-native-firebase/messaging when only that is installed', () => {
    withTempProject(
      {
        'package.json': JSON.stringify({
          dependencies: { '@react-native-firebase/messaging': '^24.1.1' },
        }),
      },
      (projectRoot) =>
        expect(resolveBaseClass(undefined, projectRoot)).toBe(
          RNFIREBASE_MESSAGING_SERVICE,
        ),
    );
  });

  it('prefers expo-notifications when both known libraries are installed', () => {
    withTempProject(
      {
        'package.json': JSON.stringify({
          dependencies: {
            'expo-notifications': '~57.0.8',
            '@react-native-firebase/messaging': '^24.1.1',
          },
        }),
      },
      (projectRoot) =>
        expect(resolveBaseClass(undefined, projectRoot)).toBe(
          EXPO_NOTIFICATIONS_SERVICE,
        ),
    );
  });

  it('honours an explicit RNFB string even when expo-notifications is also installed', () => {
    withTempProject(
      {
        'package.json': JSON.stringify({
          dependencies: {
            'expo-notifications': '~57.0.8',
            '@react-native-firebase/messaging': '^24.1.1',
          },
        }),
      },
      (projectRoot) =>
        expect(
          resolveBaseClass(RNFIREBASE_MESSAGING_SERVICE, projectRoot),
        ).toBe(RNFIREBASE_MESSAGING_SERVICE),
    );
  });
});

describe('isRNFirebaseMessagingInstalled', () => {
  const withTempProject = (
    files: Record<string, string>,
    assertion: (projectRoot: string) => void,
  ) => {
    const projectRoot = fs.mkdtempSync(path.join(tmpdir(), 'stream-plugin-'));
    try {
      for (const [relativePath, contents] of Object.entries(files)) {
        const target = path.join(projectRoot, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents);
      }
      assertion(projectRoot);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  };

  it('is true when @react-native-firebase/messaging is a runtime dependency', () => {
    withTempProject(
      {
        'package.json': JSON.stringify({
          dependencies: { '@react-native-firebase/messaging': '^24.1.1' },
        }),
      },
      (projectRoot) =>
        expect(isRNFirebaseMessagingInstalled(projectRoot)).toBe(true),
    );
  });

  it('ignores a devDependency, which is not linked into the build', () => {
    withTempProject(
      {
        'package.json': JSON.stringify({
          devDependencies: { '@react-native-firebase/messaging': '^24.1.1' },
        }),
      },
      (projectRoot) =>
        expect(isRNFirebaseMessagingInstalled(projectRoot)).toBe(false),
    );
  });

  it('is false when nothing is installed and package.json is empty', () => {
    withTempProject({ 'package.json': '{}' }, (projectRoot) =>
      expect(isRNFirebaseMessagingInstalled(projectRoot)).toBe(false),
    );
  });
});

describe('isExpoNotificationsInstalled', () => {
  it('is true in the monorepo and false for a bogus root', () => {
    expect(isExpoNotificationsInstalled()).toBe(true);
    expect(isExpoNotificationsInstalled('/definitely/not/a/real/path')).toBe(
      false,
    );
  });

  // Regression: detection used require.resolve, which walks up the directory
  // tree and so found the copy of expo-notifications that a *sibling* workspace
  // hoisted. The package is not linked into that app's Android build, and the
  // generated service failed to compile with "Unresolved reference".
  describe('in a workspace', () => {
    const sampleApp = (name: string) =>
      path.join(__dirname, '..', '..', '..', '..', 'sample-apps', name);

    it('is false for an app that does not use expo-notifications', () => {
      const projectRoot = sampleApp('react-native/ringing-tutorial');
      // guard: the hoisted copy *is* reachable by walking up, which is the trap
      expect(
        fs.existsSync(
          path.join(projectRoot, 'node_modules', 'expo-notifications'),
        ),
      ).toBe(false);
      expect(isExpoNotificationsInstalled(projectRoot)).toBe(false);
    });

    it('is true for an app that does use expo-notifications', () => {
      expect(
        isExpoNotificationsInstalled(
          sampleApp('react-native/expo-video-sample'),
        ),
      ).toBe(true);
    });
  });

  /**
   * Runs `assertion` against a throwaway project directory. The directory is
   * removed in a `finally` so a failing assertion does not leave it behind.
   */
  const withTempProject = (
    files: Record<string, string>,
    assertion: (projectRoot: string) => void,
  ) => {
    const projectRoot = fs.mkdtempSync(path.join(tmpdir(), 'stream-plugin-'));
    try {
      for (const [relativePath, contents] of Object.entries(files)) {
        const target = path.join(projectRoot, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents);
      }
      assertion(projectRoot);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  };

  it('detects a declared package even when hoisted out of the app', () => {
    withTempProject(
      {
        'package.json': JSON.stringify({
          dependencies: { 'expo-notifications': '~57.0.8' },
        }),
      },
      // nothing installed under the app: the declaration is the only signal
      (projectRoot) =>
        expect(isExpoNotificationsInstalled(projectRoot)).toBe(true),
    );
  });

  it('ignores a devDependency, which is not linked into the build', () => {
    withTempProject(
      {
        'package.json': JSON.stringify({
          devDependencies: { 'expo-notifications': '~57.0.8' },
        }),
      },
      (projectRoot) =>
        expect(isExpoNotificationsInstalled(projectRoot)).toBe(false),
    );
  });

  it('detects a package installed under the app but not declared', () => {
    withTempProject(
      {
        'package.json': '{}',
        'node_modules/expo-notifications/package.json': '{}',
      },
      (projectRoot) =>
        expect(isExpoNotificationsInstalled(projectRoot)).toBe(true),
    );
  });

  it('is false when the app package.json is unreadable and nothing is installed', () => {
    withTempProject({ 'package.json': 'not json' }, (projectRoot) =>
      expect(isExpoNotificationsInstalled(projectRoot)).toBe(false),
    );
  });
});

describe('withAndroidMessagingService (ringing gate)', () => {
  const config = { name: 'app', slug: 'app' } as never;

  it('is a no-op when ringing is not enabled', () => {
    expect(withAndroidMessagingService(config, {})).toBe(config);
    expect(withAndroidMessagingService(config, { ringing: false })).toBe(
      config,
    );
    expect(withAndroidMessagingService(config, undefined)).toBe(config);
  });
});

describe('buildServiceSource', () => {
  const source = buildServiceSource(APP_PACKAGE, EXPO_BASE);

  it('declares the package and extends the provided base class by simple name', () => {
    expect(source).toContain(`package ${APP_PACKAGE}`);
    expect(source).toContain(`import ${EXPO_BASE}`);
    expect(source).toContain(
      'class StreamVideoMessagingService : ExpoFirebaseMessagingService()',
    );
  });

  it('gates call.ring (handles it, skips super) and forwards other messages to super', () => {
    expect(source).toContain(
      'if (StreamMessagingHelper.isStreamCallRing(remoteMessage))',
    );
    expect(source).toContain(
      'StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)',
    );
    expect(source).toContain('super.onMessageReceived(remoteMessage)');
    // the ring is handled before super, and short-circuits with a return
    const gateIndex = source.indexOf('isStreamCallRing');
    const superIndex = source.indexOf('super.onMessageReceived');
    expect(gateIndex).toBeLessThan(superIndex);
    expect(source).toMatch(
      /handleMessage\(applicationContext, remoteMessage\)\s*\n\s*return/,
    );
  });

  it('forwards onNewToken via StreamMessagingHelper', () => {
    expect(source).toContain('override fun onNewToken(token: String)');
    expect(source).toContain('super.onNewToken(token)');
    expect(source).toContain('StreamMessagingHelper.forwardNewToken(token)');
    // no direct coupling to RN Firebase internals in the generated code
    expect(source).not.toContain('ReactNativeFirebaseEventEmitter');
  });

  it('always emits the onNewToken override regardless of base class', () => {
    const rnfbSource = buildServiceSource(
      APP_PACKAGE,
      'io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService',
    );
    expect(rnfbSource).toContain('override fun onNewToken(token: String)');
    expect(rnfbSource).toContain(
      'StreamMessagingHelper.forwardNewToken(token)',
    );
  });
});

describe('updateManifest', () => {
  const generatedFqcn = getGeneratedServiceFqcn(APP_PACKAGE);
  const baseClass = EXPO_BASE;

  function servicesOf(manifest: Manifest) {
    return manifest.manifest.application![0].service ?? [];
  }

  function isRemoval(service: { $?: Record<string, string> }, name: string) {
    return (
      service.$?.['android:name'] === name &&
      service.$?.['tools:node'] === 'remove'
    );
  }

  it('registers the generated service as the MESSAGING_EVENT handler', () => {
    const manifest = updateManifest(emptyManifest(), generatedFqcn, baseClass);
    const services = servicesOf(manifest);

    const generated = services.find(
      (s) => s.$?.['android:name'] === generatedFqcn,
    );
    expect(generated).toBeDefined();
    expect(
      generated?.['intent-filter']?.[0].action?.[0].$['android:name'],
    ).toBe('com.google.firebase.MESSAGING_EVENT');
  });

  it('removes callingx + the chosen base + every known FCM competitor, leaving only the generated handler', () => {
    const services = servicesOf(
      updateManifest(emptyManifest(), generatedFqcn, baseClass),
    );
    expect(services.some((s) => isRemoval(s, STREAM_DEFAULT_SERVICE))).toBe(
      true,
    );
    expect(services.some((s) => isRemoval(s, baseClass))).toBe(true);
    // Always-strip: the other known FCM competitor (RNFB) is removed too,
    // even though the chosen base is expo-notifications. This prevents a
    // manifest-merge tie when both packages are installed.
    expect(
      services.some((s) => isRemoval(s, RNFIREBASE_MESSAGING_SERVICE)),
    ).toBe(true);

    // exactly one live MESSAGING_EVENT service (the generated one) remains
    const liveHandlers = services.filter(
      (s) => s['intent-filter'] && s.$?.['tools:node'] !== 'remove',
    );
    expect(liveHandlers).toHaveLength(1);
    expect(liveHandlers[0].$?.['android:name']).toBe(generatedFqcn);
  });

  it('strips expo-notifications too when the chosen base is RNFB', () => {
    const services = servicesOf(
      updateManifest(
        emptyManifest(),
        generatedFqcn,
        RNFIREBASE_MESSAGING_SERVICE,
      ),
    );
    expect(
      services.some((s) => isRemoval(s, RNFIREBASE_MESSAGING_SERVICE)),
    ).toBe(true);
    expect(services.some((s) => isRemoval(s, EXPO_NOTIFICATIONS_SERVICE))).toBe(
      true,
    );
    expect(services.some((s) => isRemoval(s, STREAM_DEFAULT_SERVICE))).toBe(
      true,
    );
  });

  it('does not emit a duplicate removal when base class is the Stream default', () => {
    const services = servicesOf(
      updateManifest(emptyManifest(), generatedFqcn, STREAM_DEFAULT_SERVICE),
    );
    const removals = services.filter((s) =>
      isRemoval(s, STREAM_DEFAULT_SERVICE),
    );
    expect(removals).toHaveLength(1);
  });

  it('does not emit a duplicate removal when base class is expo-notifications (in the always-strip list)', () => {
    const services = servicesOf(
      updateManifest(
        emptyManifest(),
        generatedFqcn,
        EXPO_NOTIFICATIONS_SERVICE,
      ),
    );
    const removals = services.filter((s) =>
      isRemoval(s, EXPO_NOTIFICATIONS_SERVICE),
    );
    expect(removals).toHaveLength(1);
  });

  it('adds the tools namespace', () => {
    const manifest = updateManifest(emptyManifest(), generatedFqcn, baseClass);
    expect(manifest.manifest.$['xmlns:tools']).toBe(
      'http://schemas.android.com/tools',
    );
  });

  it('is idempotent across re-runs', () => {
    let manifest = updateManifest(emptyManifest(), generatedFqcn, baseClass);
    manifest = updateManifest(manifest, generatedFqcn, baseClass);
    const services = servicesOf(manifest);

    const count = (name: string) =>
      services.filter((s) => s.$?.['android:name'] === name).length;

    expect(count(generatedFqcn)).toBe(1);
    expect(count(STREAM_DEFAULT_SERVICE)).toBe(1);
    expect(count(baseClass)).toBe(1);
    // The always-strip competitor entry stays de-duplicated too.
    expect(count(RNFIREBASE_MESSAGING_SERVICE)).toBe(1);
  });

  it('preserves unrelated services', () => {
    const manifest = emptyManifest();
    manifest.manifest.application![0].service = [
      { $: { 'android:name': 'com.example.OtherService' } },
    ] as unknown as NonNullable<
      AndroidConfig.Manifest.ManifestApplication['service']
    >;

    const updated = updateManifest(manifest, generatedFqcn, baseClass);
    const other = servicesOf(updated).find(
      (s) => s.$?.['android:name'] === 'com.example.OtherService',
    );
    expect(other).toBeDefined();
  });

  it('throws on a malformed manifest', () => {
    expect(() =>
      updateManifest(
        { manifest: {} } as unknown as Manifest,
        generatedFqcn,
        baseClass,
      ),
    ).toThrow();
  });
});
