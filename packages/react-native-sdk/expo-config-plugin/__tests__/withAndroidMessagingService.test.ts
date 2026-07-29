import { AndroidConfig } from '@expo/config-plugins';
import {
  updateManifest,
  buildServiceSource,
  validateBaseClass,
  getGeneratedServiceFqcn,
  addFirebaseMessagingDependency,
  resolveFirebaseBomVersion,
  STREAM_DEFAULT_SERVICE,
  FIREBASE_MESSAGING_ARTIFACT,
  FIREBASE_BOM_FALLBACK_VERSION,
  FIREBASE_DEP_MARKER,
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

describe('buildServiceSource', () => {
  const source = buildServiceSource(APP_PACKAGE, EXPO_BASE);

  it('declares the package and extends the provided base class by simple name', () => {
    expect(source).toContain(`package ${APP_PACKAGE}`);
    expect(source).toContain(`import ${EXPO_BASE}`);
    expect(source).toContain(
      'class StreamVideoMessagingService : ExpoFirebaseMessagingService()',
    );
  });

  it('injects Stream handling and forwards to super', () => {
    expect(source).toContain(
      'StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)',
    );
    expect(source).toContain('super.onMessageReceived(remoteMessage)');
  });

  it('forwards onNewToken via StreamMessagingHelper when base is not RN Firebase', () => {
    expect(source).toContain('override fun onNewToken(token: String)');
    expect(source).toContain('StreamMessagingHelper.forwardNewToken(token)');
    // no direct coupling to RN Firebase internals in the generated code
    expect(source).not.toContain('ReactNativeFirebaseEventEmitter');
  });

  it('omits the onNewToken override when base already is RN Firebase', () => {
    const rnfbSource = buildServiceSource(
      APP_PACKAGE,
      'io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService',
    );
    expect(rnfbSource).not.toContain('override fun onNewToken');
    expect(rnfbSource).not.toContain('forwardNewToken');
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

  it('removes both competing services, leaving only the generated handler', () => {
    const services = servicesOf(
      updateManifest(emptyManifest(), generatedFqcn, baseClass),
    );
    expect(services.some((s) => isRemoval(s, STREAM_DEFAULT_SERVICE))).toBe(
      true,
    );
    expect(services.some((s) => isRemoval(s, baseClass))).toBe(true);

    // exactly one live MESSAGING_EVENT service (the generated one) remains
    const liveHandlers = services.filter(
      (s) => s['intent-filter'] && s.$?.['tools:node'] !== 'remove',
    );
    expect(liveHandlers).toHaveLength(1);
    expect(liveHandlers[0].$?.['android:name']).toBe(generatedFqcn);
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

describe('addFirebaseMessagingDependency', () => {
  const gradle = `
android {
    namespace "io.getstream.expovideosample"
}

dependencies {
    implementation "com.facebook.react:react-android"
}
`;

  it('uses the resolved Firebase BOM (version-less artifact) when a BOM version is given', () => {
    const updated = addFirebaseMessagingDependency(gradle, '34.10.0');
    expect(updated).toContain(
      'compileOnly(platform("com.google.firebase:firebase-bom:34.10.0"))',
    );
    expect(updated).toContain(`compileOnly("${FIREBASE_MESSAGING_ARTIFACT}")`);
    // artifact declared version-less under the BOM
    expect(updated).not.toContain(`${FIREBASE_MESSAGING_ARTIFACT}:`);
  });

  it('falls back to the minimum-supported BOM when no BOM version is available', () => {
    const updated = addFirebaseMessagingDependency(gradle);
    expect(updated).toContain(
      `compileOnly(platform("com.google.firebase:firebase-bom:${FIREBASE_BOM_FALLBACK_VERSION}"))`,
    );
    expect(updated).toContain(`compileOnly("${FIREBASE_MESSAGING_ARTIFACT}")`);
    // still version-less artifact, never a pinned artifact version
    expect(updated).not.toContain(`${FIREBASE_MESSAGING_ARTIFACT}:`);
  });

  it('is idempotent (guarded by the marker comment)', () => {
    const once = addFirebaseMessagingDependency(gradle, '34.10.0');
    const twice = addFirebaseMessagingDependency(once, '34.10.0');
    const occurrences = twice.split(FIREBASE_DEP_MARKER).length - 1;
    expect(occurrences).toBe(1);
  });

  it('throws when there is no dependencies block to inject into', () => {
    expect(() =>
      addFirebaseMessagingDependency('android {\n  namespace = "x"\n}\n'),
    ).toThrow(/dependencies/);
  });
});

describe('resolveFirebaseBomVersion', () => {
  it('returns undefined when @react-native-firebase/app cannot be resolved', () => {
    expect(
      resolveFirebaseBomVersion('/definitely/not/a/real/path'),
    ).toBeUndefined();
  });

  it('reads a semver BOM string from the installed package', () => {
    // @react-native-firebase/app is installed in the monorepo.
    const bom = resolveFirebaseBomVersion();
    expect(bom).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
