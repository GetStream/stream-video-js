import { execFile, execFileSync, spawn } from 'child_process';
import { promisify } from 'util';

/**
 * adb helpers for what Detox can't do: lock and unlock the screen, read the app's foreground
 * services, kill the app the way Android does, and (outside Detox) tap system UI. The device is
 * the one in `DETOX_ADB_NAME`, or the only one attached.
 */

export const APP_PACKAGE = 'io.getstream.rnvideosample';

const sdkRoot = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
export const adbPath = sdkRoot ? `${sdkRoot}/platform-tools/adb` : 'adb';

export const deviceArgs = () => {
  const serial = process.env.DETOX_ADB_NAME;
  return serial && !serial.includes('*') ? ['-s', serial] : [];
};

export const adb = async (...args: string[]) => {
  const { stdout } = await promisify(execFile)(
    adbPath,
    [...deviceArgs(), ...args],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  return stdout;
};

export const adbSync = (...args: string[]) =>
  execFileSync(adbPath, [...deviceArgs(), ...args], { encoding: 'utf8' });

const shell = (...args: string[]) => adb('shell', ...args);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls `predicate` until it holds or `timeout` passes. Returns whether it held. */
const pollUntil = async (
  predicate: () => Promise<boolean>,
  timeout: number,
  interval = 500,
) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await predicate()) {
      return true;
    }
    if (Date.now() > deadline) {
      return false;
    }
    await sleep(interval);
  }
};

// ---------------------------------------------------------------------------------------------
// Screen and app state
// ---------------------------------------------------------------------------------------------

/** The device clock in milliseconds, so logcat timestamps can be compared with it. */
export const deviceNowMs = async () =>
  Math.round(parseFloat((await shell('date', '+%s.%N')).trim()) * 1000) ||
  Number((await shell('date', '+%s')).trim()) * 1000;

export const isScreenAwake = async () =>
  /mWakefulness=Awake/.test(await shell('dumpsys', 'power'));

export const isKeyguardShowing = async () =>
  /isKeyguardShowing=true/.test(await shell('dumpsys', 'window'));

/** Turns the screen off, which locks it. Resolves once the device reports it is asleep. */
export const lockScreen = async () => {
  await shell('input', 'keyevent', 'KEYCODE_SLEEP');
  const asleep = await pollUntil(async () => !(await isScreenAwake()), 10_000);
  if (!asleep) {
    throw new Error('The screen did not turn off');
  }
};

/**
 * Turns the screen on and dismisses the lock screen. Only works when the screen lock is "Swipe" or
 * "None": a PIN, pattern or password can't be entered from here.
 */
export const unlockScreen = async () => {
  await shell('input', 'keyevent', 'KEYCODE_WAKEUP');
  await pollUntil(isScreenAwake, 10_000);
  await shell('wm', 'dismiss-keyguard');
  const unlocked = await pollUntil(
    async () => !(await isKeyguardShowing()),
    10_000,
  );
  if (!unlocked) {
    throw new Error(
      'The lock screen is still showing. Set the screen lock to "Swipe" or "None" on the test device.',
    );
  }
};

/** Goes to the home screen. The app keeps running in the background. */
export const pressHome = () => shell('input', 'keyevent', 'KEYCODE_HOME');

/** The app's process id, or `undefined` when it is not running. */
export const appPid = async () => {
  try {
    const pid = (await shell('pidof', APP_PACKAGE)).trim();
    return pid || undefined;
  } catch {
    // pidof exits with 1 when there is no such process
    return undefined;
  }
};

/**
 * Whether Android has the app in the "stopped" state, the state a force stop leaves it in.
 * Android drops pushes to a stopped app.
 */
export const isAppStopped = async () => {
  const dump = await shell('dumpsys', 'package', APP_PACKAGE);
  return /User 0:[^\n]*\bstopped=true/.test(dump);
};

/**
 * Kills the app's process the way Android does when it needs memory, after the user leaves it.
 * Unlike a force stop, this doesn't put the app in the stopped state, so pushes still reach it.
 * `am kill` only kills a process that is in the background and has no foreground service.
 */
export const killAppInBackground = async () => {
  await pressHome();
  const killed = await pollUntil(
    async () => {
      await shell('am', 'kill', APP_PACKAGE);
      return (await appPid()) === undefined;
    },
    30_000,
    2_000,
  );
  if (!killed) {
    throw new Error(
      `Android did not kill ${APP_PACKAGE}. It probably still runs a foreground service.`,
    );
  }
  if (await isAppStopped()) {
    throw new Error(
      `${APP_PACKAGE} is in the stopped state, so Android will drop its pushes. Open the app once by hand.`,
    );
  }
};

/**
 * Stops the app and anything attached to it, such as a Detox runner left over from an earlier run
 * (Android never kills a process while a runner is attached). Leaves the app in the stopped state,
 * which opening it from the launcher clears.
 */
export const forceStopApp = () => shell('am', 'force-stop', APP_PACKAGE);

/**
 * Waits until one of the app's windows has focus. Used instead of reading the call screen:
 * `uiautomator dump` fails ("could not get idle state") while a call is on screen, because it
 * never stops animating.
 */
export const waitForAppInForeground = async (timeout = 15_000) => {
  const focused = await pollUntil(async () => {
    const focus = (await shell('dumpsys', 'window'))
      .split('\n')
      .find((line) => line.includes('mCurrentFocus'));
    return focus?.includes(APP_PACKAGE) ?? false;
  }, timeout);
  if (!focused) {
    throw new Error(`${APP_PACKAGE} did not come to the foreground`);
  }
};

/** Opens the app from its launcher icon, the way a user does. Not through Detox. */
export const launchAppFromLauncher = () =>
  shell(
    'monkey',
    '-p',
    APP_PACKAGE,
    '-c',
    'android.intent.category.LAUNCHER',
    '1',
  );

// ---------------------------------------------------------------------------------------------
// Foreground services: which one keeps the call alive
// ---------------------------------------------------------------------------------------------

/** The SDK's own keep-alive service, used for calls that callingx doesn't manage. */
export const SDK_KEEP_ALIVE_SERVICE =
  'com.streamvideo.reactnative.keepalive.StreamCallKeepAliveHeadlessService';
/** callingx's Telecom call service, used for ringing calls and, with `enableOngoingCalls`, for all calls. */
export const CALLINGX_CALL_SERVICE = 'io.getstream.rn.callingx.CallService';

export type KeepAliveBackend = 'sdk' | 'callingx';

const serviceForBackend: Record<KeepAliveBackend, string> = {
  sdk: SDK_KEEP_ALIVE_SERVICE,
  callingx: CALLINGX_CALL_SERVICE,
};

/** Class names of the app's services that are running in the foreground right now. */
export const foregroundServices = async () => {
  const dump = await shell('dumpsys', 'activity', 'services', APP_PACKAGE);
  return dump
    .split(/\n\s*\* ServiceRecord\{/)
    .slice(1)
    .filter((record) => /isForeground=true/.test(record))
    .map((record) => {
      // `efd590f u0 io.getstream.rnvideosample/com.foo.Bar c:io.getstream.rnvideosample}`
      // (the ` c:<process>` part is missing on older Android versions)
      const name = record.match(/^\S+ \S+ ([^\s}]+)/)?.[1] ?? '';
      // `io.getstream.rnvideosample/com.foo.Bar` or `io.getstream.rnvideosample/.Bar`
      const [pkg, cls = ''] = name.split('/');
      return cls.startsWith('.') ? `${pkg}${cls}` : cls;
    });
};

/**
 * Waits until the service of `backend` runs in the foreground and the other one doesn't, and
 * returns the foreground services it saw last.
 */
export const waitForKeepAliveBackend = async (
  backend: KeepAliveBackend,
  timeout = 15_000,
) => {
  const other: KeepAliveBackend = backend === 'sdk' ? 'callingx' : 'sdk';
  let services: string[] = [];
  const settled = await pollUntil(async () => {
    services = await foregroundServices();
    return (
      services.includes(serviceForBackend[backend]) &&
      !services.includes(serviceForBackend[other])
    );
  }, timeout);
  if (!settled) {
    throw new Error(
      `Expected only the ${backend} keep-alive service (${serviceForBackend[backend]}) in the foreground, ` +
        `found: [${services.join(', ') || 'none'}]`,
    );
  }
  return services;
};

// ---------------------------------------------------------------------------------------------
// logcat
// ---------------------------------------------------------------------------------------------

export type LogLine = { timeMs: number; message: string };

/**
 * Collects the app's JS log lines that match `pattern` from now until `stop()` is called. Streams
 * logcat instead of reading the buffer at the end, because the app logs a lot at debug level and
 * the buffer wraps within minutes.
 */
export const collectJsLogs = (pattern: string) => {
  const lines: LogLine[] = [];
  const child = spawn(
    adbPath,
    [
      ...deviceArgs(),
      'logcat',
      '-v',
      'epoch',
      '-T',
      '1',
      '-e',
      pattern,
      'ReactNativeJS:V',
      '*:S',
    ],
    { stdio: ['ignore', 'pipe', 'ignore'] },
  );
  let pending = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    pending += chunk;
    const complete = pending.split('\n');
    pending = complete.pop() ?? '';
    for (const line of complete) {
      // `  1731491234.567  1234  1250 I ReactNativeJS: '[e2e] js heartbeat #3 appState=active'`
      const match = line.match(
        /^\s*(\d+\.\d+)\s+\d+\s+\d+\s+\w\s+[^:]+:\s?(.*)$/,
      );
      if (match) {
        lines.push({
          timeMs: Math.round(parseFloat(match[1]) * 1000),
          message: match[2],
        });
      }
    }
  });
  return {
    lines,
    stop: () => {
      child.kill();
      return lines;
    },
  };
};

// ---------------------------------------------------------------------------------------------
// System UI (uiautomator): notifications, and the app itself outside Detox. Works while Detox runs.
// ---------------------------------------------------------------------------------------------

export type UiNode = {
  text: string;
  resourceId: string;
  contentDesc: string;
  packageName: string;
  centerX: number;
  centerY: number;
};

/** The nodes on screen right now, from `uiautomator dump`. React Native puts testIDs in `resource-id`. */
export const dumpUi = async (): Promise<UiNode[]> => {
  const xml = await adb('exec-out', 'uiautomator', 'dump', '/dev/tty');
  const nodes: UiNode[] = [];
  for (const [, attributes] of xml.matchAll(/<node ([^>]*?)\/?>/g)) {
    const attribute = (name: string) =>
      attributes
        .match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]
        ?.replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>') ?? '';
    const bounds = attribute('bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!bounds) {
      continue;
    }
    const [x1, y1, x2, y2] = bounds.slice(1).map(Number);
    nodes.push({
      text: attribute('text'),
      resourceId: attribute('resource-id'),
      contentDesc: attribute('content-desc'),
      packageName: attribute('package'),
      centerX: Math.round((x1 + x2) / 2),
      centerY: Math.round((y1 + y2) / 2),
    });
  }
  return nodes;
};

export type UiSelector = (node: UiNode) => boolean;

export const byResourceId =
  (id: string): UiSelector =>
  (node) =>
    node.resourceId === id || node.resourceId.endsWith(`:id/${id}`);

export const byText =
  (text: RegExp): UiSelector =>
  (node) =>
    text.test(node.text) || text.test(node.contentDesc);

/** Waits until a node matching `selector` is on screen and returns it, or `undefined` on timeout. */
export const waitForUiNode = async (
  selector: UiSelector,
  timeout = 15_000,
): Promise<UiNode | undefined> => {
  let found: UiNode | undefined;
  await pollUntil(
    async () => {
      try {
        found = (await dumpUi()).find(selector);
      } catch {
        // the screen changed during the dump; try again
        found = undefined;
      }
      return found !== undefined;
    },
    timeout,
    1_000,
  );
  return found;
};

export const tapUiNode = (node: UiNode) =>
  shell('input', 'tap', String(node.centerX), String(node.centerY));

/** Waits for a node, taps it, and fails with `description` if it never shows up. */
export const waitAndTapUiNode = async (
  selector: UiSelector,
  description: string,
  timeout = 15_000,
) => {
  const node = await waitForUiNode(selector, timeout);
  if (!node) {
    throw new Error(`${description} did not show up within ${timeout / 1000}s`);
  }
  await tapUiNode(node);
  return node;
};

/** Replaces the text of the focused field: moves to the end, deletes everything, types `text`. */
export const replaceFocusedText = async (text: string) => {
  await shell('input', 'keyevent', 'KEYCODE_MOVE_END');
  await shell('input', 'keyevent', ...Array(60).fill('KEYCODE_DEL'));
  await shell('input', 'text', text);
};

export const openNotificationShade = () =>
  shell('cmd', 'statusbar', 'expand-notifications');

export const collapseNotificationShade = () =>
  shell('cmd', 'statusbar', 'collapse');

/** The incoming call notification's answer action. Its text is up to the system UI. */
const answerAction = byText(/^(answer|accept)$/i);

/**
 * Taps the answer action on the incoming call notification (callingx's, shown by the system).
 * Opens the notification shade first: a `uiautomator dump` of the ringing screen can take 10s
 * while it animates, and the ring times out after 25s. Works while Detox runs.
 */
export const answerCallFromNotification = async () => {
  await openNotificationShade();
  const node = await waitAndTapUiNode(
    answerAction,
    'The answer action in the notification shade',
  );
  console.log(
    `Tapped "${node.text || node.contentDesc}" (${node.packageName}) at ${node.centerX},${node.centerY}`,
  );
};
