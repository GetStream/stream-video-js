import { spawn } from 'child_process';

import { adb, adbPath, adbSync, APP_PACKAGE, deviceArgs } from './Adb';

/**
 * Helpers for the push ringing tests (`tests/RingPushTests.e2e.ts`, `push/`): a ring that reaches
 * the app only through Firebase, which callingx's `StreamMessagingReceiver` handles natively.
 * Works with Detox and without it.
 */

/** callingx's incoming call notification channel (`stream_incoming_calls_channel` by default). */
const INCOMING_CALL_CHANNEL = 'stream_incoming_calls_channel';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Whether the device can receive pushes. Firebase delivers them through Google Play services, which
 * CI's emulator image doesn't have. Synchronous, so a test file can skip its tests while Jest
 * collects them.
 */
export const hasGooglePlayServices = () => {
  try {
    return adbSync('shell', 'pm', 'path', 'com.google.android.gms').includes(
      'package:',
    );
  } catch {
    return false;
  }
};

/**
 * Collects log lines from every tag that match `pattern`, from now until `stop()`. callingx logs
 * with `debugLog`, so its lines are only there in debug builds; Android's own lines (ActivityManager)
 * are there in every build.
 */
export const collectDeviceLogs = (pattern: string) => {
  const lines: string[] = [];
  const child = spawn(
    adbPath,
    [...deviceArgs(), 'logcat', '-v', 'time', '-T', '1', '-e', pattern],
    { stdio: ['ignore', 'pipe', 'ignore'] },
  );
  let pending = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    pending += chunk;
    const complete = pending.split('\n');
    pending = complete.pop() ?? '';
    lines.push(
      ...complete.filter(
        // adbd logs the logcat command it runs, pattern included, so that line always matches.
        (line) => line.trim() && !line.includes('exec logcat'),
      ),
    );
  });
  return {
    lines,
    stop: () => {
      child.kill();
      return lines;
    },
  };
};

/**
 * The log lines {@link countRingPushesHandled}, {@link appStartedForRingPush} and
 * {@link servicesThatGotTheRingPush} read. `logcat -e` matches the message, not the tag:
 * `onReceive messageId` is the receiver's own message, `onMessageReceived messageId` is the
 * messaging services', `already handled, skipping` is `StreamMessagingHelper.handleMessage` skipping a
 * duplicate, and `StreamMessagingReceiver` matches Android's "Start proc … for broadcast …" line.
 */
export const RING_PUSH_LOG_PATTERN =
  'onReceive messageId|onMessageReceived messageId|already handled, skipping|StreamMessagingReceiver|startIncomingCallFromPush|ForegroundServiceStartNotAllowed';

// ---------------------------------------------------------------------------------------------
// The app's own Firebase messaging service (debug builds only)
// ---------------------------------------------------------------------------------------------

/**
 * The dogfood app's stand-in for an app's own Firebase messaging service
 * (`android/app/src/debug/.../e2e/E2EAppMessagingService.kt`). It is declared above callingx's
 * `StreamMessagingService`, and disabled until a test turns it on.
 */
export const APP_MESSAGING_SERVICE = `${APP_PACKAGE}.e2e.E2EAppMessagingService`;
const STREAM_MESSAGING_SERVICE =
  'io.getstream.rn.callingx.StreamMessagingService';

/**
 * Asks the app to turn its own messaging service on or off, through its debug-only
 * `E2EAppMessagingServiceSwitch` receiver: Android 14+ doesn't let `adb shell pm enable` change an
 * app's components. `-f 32` (FLAG_INCLUDE_STOPPED_PACKAGES) reaches a force-stopped app too. The app
 * keeps running.
 */
const switchAppMessagingService = async (
  enabled: boolean,
  forwardMessages = false,
) => {
  const output = await adb(
    'shell',
    'am',
    'broadcast',
    '-f',
    '32',
    '-n',
    `${APP_PACKAGE}/.e2e.E2EAppMessagingServiceSwitch`,
    '--ez',
    'enabled',
    String(enabled),
    '--ez',
    'forward',
    String(forwardMessages),
  );
  if (!/result=0/.test(output)) {
    throw new Error(
      `Could not turn the app's messaging service ${enabled ? 'on' : 'off'}: ${output.trim()}`,
    );
  }
};

/**
 * Turns the app's own messaging service on. Android then delivers every Firebase message and token
 * update to it instead of callingx's service.
 *
 * @param forwardMessages makes it pass every message to `StreamMessagingHelper.handleMessage`, as
 * an app that followed the old integration docs does. A ring push then reaches `handleMessage`
 * twice: from callingx's receiver and from the app.
 */
export const enableAppMessagingService = ({ forwardMessages = false } = {}) =>
  switchAppMessagingService(true, forwardMessages);

/** Puts the app's own messaging service back to its manifest state (off). */
export const resetAppMessagingService = () => switchAppMessagingService(false);

/** The app's enabled Firebase messaging services, in the order Android picks them (first wins). */
export const messagingServices = async () => {
  const output = await adb(
    'shell',
    'cmd',
    'package',
    'query-services',
    '--brief',
    '-a',
    'com.google.firebase.MESSAGING_EVENT',
    '-p',
    APP_PACKAGE,
  );
  return [...output.matchAll(new RegExp(`${APP_PACKAGE}/([\\w.]+)`, 'g'))].map(
    ([, name]) => (name.startsWith('.') ? `${APP_PACKAGE}${name}` : name),
  );
};

/** Asserts that Android hands Firebase messages to the app's own service, not to callingx's. */
export const assertAppMessagingServiceWins = async () => {
  const services = await messagingServices();
  if (services[0] !== APP_MESSAGING_SERVICE) {
    throw new Error(
      `Expected ${APP_MESSAGING_SERVICE} to get Firebase messages, but Android picks: [${services.join(', ')}]`,
    );
  }
};

/**
 * Which messaging service got the `call.ring` push that callingx's receiver handled: `appService`
 * for the app's own one, `streamService` for callingx's. Firebase gives each message to one
 * service only.
 */
export const servicesThatGotTheRingPush = (lines: string[]) => {
  const ringMessageIds = lines
    .filter(
      (line) =>
        /StreamMessagingReceiver.*onReceive /.test(line) &&
        /type=call\.ring/.test(line),
    )
    .map((line) => line.match(/messageId=([^\s,]+)/)?.[1])
    .filter((id): id is string => Boolean(id));
  const gotIt = (tag: string) =>
    lines.filter(
      (line) =>
        line.includes(tag) &&
        line.includes('onMessageReceived') &&
        ringMessageIds.some((id) => line.includes(`messageId=${id}`)),
    ).length;
  return {
    appService: gotIt('E2EAppMessagingService'),
    streamService: gotIt(STREAM_MESSAGING_SERVICE.split('.').pop()!),
  };
};

/**
 * Asserts that the app's own service, not callingx's, got the `call.ring` push, exactly once. Run
 * after {@link assertRingPushHandledOnce}, which waits for the push.
 */
export const assertAppMessagingServiceGotTheRingPush = (logs: {
  lines: string[];
}) => {
  const got = servicesThatGotTheRingPush(logs.lines);
  if (got.appService !== 1 || got.streamService !== 0) {
    throw new Error(
      `Expected only the app's own messaging service to get the ring push. ` +
        `App's service: ${got.appService}×, Stream's service: ${got.streamService}×.\n${logs.lines.join('\n')}`,
    );
  }
};

/**
 * Asserts that `StreamMessagingHelper.handleMessage` got the ring push a second time, from the app's
 * own service, and skipped it. Run after {@link assertRingPushHandledOnce}, which waits for the
 * push and checks that it started one incoming call.
 */
export const assertDuplicateRingPushSkipped = (logs: { lines: string[] }) => {
  const { skippedAsDuplicate } = countRingPushesHandled(logs.lines);
  if (skippedAsDuplicate !== 1) {
    throw new Error(
      `Expected handleMessage to skip the forwarded copy of the ring push once, skipped ${skippedAsDuplicate}×.\n${logs.lines.join('\n')}`,
    );
  }
};

/**
 * How many `call.ring` pushes callingx's receiver handled, and how many incoming calls it started
 * from them, in `lines` from {@link collectDeviceLogs}. Debug builds only (callingx's `debugLog`).
 */
export const countRingPushesHandled = (lines: string[]) => ({
  received: lines.filter(
    (line) =>
      /StreamMessagingReceiver.*onReceive /.test(line) &&
      /type=call\.ring/.test(line),
  ).length,
  started: lines.filter((line) =>
    /startIncomingCallFromPush: Starting incoming call from push/.test(line),
  ).length,
  blocked: lines.filter((line) =>
    /ForegroundServiceStartNotAllowed|startIncomingCallFromPush: Failed to start service/.test(
      line,
    ),
  ).length,
  skippedAsDuplicate: lines.filter((line) =>
    /StreamMessagingHelper.*already handled, skipping/.test(line),
  ).length,
});

/**
 * Whether Android started the app's process to deliver a push to callingx's receiver. Android logs
 * this itself, in every build:
 * `ActivityManager: Start proc 1234:io.getstream.rnvideosample/u0a506 for broadcast {…/…StreamMessagingReceiver}`
 */
export const appStartedForRingPush = (lines: string[]) =>
  lines.some((line) =>
    new RegExp(
      `Start proc \\d+:${APP_PACKAGE.replace(/\./g, '\\.')}/.*broadcast.*StreamMessagingReceiver`,
    ).test(line),
  );

/** How many of callingx's incoming call notifications are showing right now. */
export const incomingCallNotificationCount = async () => {
  const dump = await adb('shell', 'dumpsys', 'notification', '--noredact');
  return dump
    .split('\n')
    .filter(
      (line) =>
        line.includes('NotificationRecord(') &&
        line.includes(`pkg=${APP_PACKAGE}`) &&
        line.includes(`channel=${INCOMING_CALL_CHANNEL}`),
    ).length;
};

/**
 * Waits until no incoming call notification shows. A test's ring keeps going after the test ends,
 * until the ring timeout (25s for the `default` call type), and its notification can still be
 * showing when the next test starts.
 */
export const waitForNoIncomingCallNotification = async (timeout = 40_000) => {
  const start = Date.now();
  const deadline = start + timeout;
  for (;;) {
    const count = await incomingCallNotificationCount();
    if (count === 0) {
      if (Date.now() - start > 1_000) {
        console.log(
          `Waited ${Math.round((Date.now() - start) / 1000)}s for an earlier ring's notification to go away`,
        );
      }
      return;
    }
    if (Date.now() > deadline) {
      throw new Error(
        `${count} incoming call notifications still show after ${timeout / 1000}s, from an earlier ring`,
      );
    }
    await sleep(1_000);
  }
};

/** Waits until callingx shows exactly one incoming call notification. */
export const waitForOneIncomingCallNotification = async (timeout = 30_000) => {
  const deadline = Date.now() + timeout;
  let count = 0;
  for (;;) {
    count = await incomingCallNotificationCount();
    if (count === 1) {
      return;
    }
    if (count > 1) {
      throw new Error(
        `${count} incoming call notifications show, expected one`,
      );
    }
    if (Date.now() > deadline) {
      throw new Error(
        `No incoming call notification showed within ${timeout / 1000}s`,
      );
    }
    await sleep(1_000);
  }
};

/**
 * Asserts that the push rang the app exactly once: callingx's receiver got the `call.ring` push
 * once, started one incoming call from it, and Android didn't block the call service. Waits a little
 * for the log lines to arrive.
 */
export const assertRingPushHandledOnce = async (logs: { lines: string[] }) => {
  const deadline = Date.now() + 10_000;
  let counts = countRingPushesHandled(logs.lines);
  while (counts.started < 1 && Date.now() < deadline) {
    await sleep(500);
    counts = countRingPushesHandled(logs.lines);
  }
  // A second, duplicate handling would show up right after the first.
  await sleep(2_000);
  counts = countRingPushesHandled(logs.lines);
  if (counts.received !== 1 || counts.started !== 1 || counts.blocked !== 0) {
    throw new Error(
      `Expected the ring push to be received once and to start one incoming call. ` +
        `Received ${counts.received}×, started ${counts.started}×, blocked ${counts.blocked}×. ` +
        `callingx only logs this in debug builds.\n${logs.lines.join('\n')}`,
    );
  }
};
