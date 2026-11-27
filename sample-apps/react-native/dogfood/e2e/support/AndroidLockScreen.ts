import { execFile } from 'child_process';
import { promisify } from 'util';

import { waitUntil } from './Element';

const adb = async (...args: string[]) => {
  const sdkRoot = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  const executable = sdkRoot ? `${sdkRoot}/platform-tools/adb` : 'adb';
  const { stdout } = await promisify(execFile)(
    executable,
    ['-s', device.id, ...args],
    {
      timeout: 10_000,
      // OEM notification dumps can exceed Node's default 1 MiB output limit.
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  return stdout;
};

export const assertAndroidLocked = async () => {
  const policy = await adb('shell', 'dumpsys', 'window', 'policy');
  if (
    !/(?:showing|isStatusBarKeyguard|mShowingLockscreen|keyguardShowing)=true/.test(
      policy,
    )
  ) {
    throw new Error(
      'Android keyguard is not showing; use a device with swipe screen lock enabled',
    );
  }
};

export const lockAndroidScreen = async () => {
  await adb('shell', 'cmd', 'statusbar', 'collapse');
  await adb('shell', 'input', 'keyevent', 'KEYCODE_SLEEP');
  const locked = await waitUntil(async () => {
    try {
      await assertAndroidLocked();
      return true;
    } catch {
      return false;
    }
  });
  if (!locked)
    throw new Error(
      'Could not lock Android; enable swipe screen lock before running',
    );
};

/** Match the callingx notification ID (Java String.hashCode, with the sign bit cleared). */
export const assertAndroidCallNotificationRemoved = async (callId: string) => {
  const cid = `default:${callId}`;
  let hash = 0;
  for (let index = 0; index < cid.length; index++) {
    hash = (Math.imul(31, hash) + cid.charCodeAt(index)) | 0;
  }
  const notificationId = hash & 0x7fffffff;
  const removed = await waitUntil(async () => {
    const notifications = await adb('shell', 'dumpsys', 'notification');
    // Restrict to active NotificationRecord lines, excluding the historical archive.
    const active = notifications.split(/Historical notifications/i)[0];
    return !active
      .split('\n')
      .some(
        (line) =>
          line.includes('NotificationRecord(') &&
          line.includes('pkg=io.getstream.rnvideosample ') &&
          new RegExp(`\\bid=${notificationId}\\b`).test(line),
      );
  });
  if (!removed)
    throw new Error(
      `Declined call ${cid} still has an active native notification`,
    );
};

/** Retain row boundaries so expansion and decline target the same incoming-call card. */
const incomingNotificationRow = (xml: string) => {
  const stack: Array<{ start: number; tag: string }> = [];
  for (const match of xml.matchAll(/<node\b[^>]*>|<\/node>/g)) {
    const tag = match[0];
    if (tag === '</node>') {
      const opening = stack.pop();
      if (
        opening?.tag.includes(
          'com.android.systemui:id/expandableNotificationRow',
        )
      ) {
        const row = xml.slice(opening.start, match.index + tag.length);
        if (/(?:text|content-desc)="Incoming call"/i.test(row)) return row;
      }
    } else if (!tag.endsWith('/>')) {
      stack.push({ start: match.index, tag });
    }
  }
  return undefined;
};

const tapNode = async (node: string) => {
  const bounds = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!bounds) throw new Error('Notification action has no screen bounds');
  const [, left, top, right, bottom] = bounds.map(Number);
  if (right <= left || bottom <= top)
    throw new Error('Notification action is outside the visible screen');
  await assertAndroidLocked();
  await adb(
    'shell',
    'input',
    'tap',
    String(Math.floor((left + right) / 2)),
    String(Math.floor((top + bottom) / 2)),
  );
};

/** Operate System UI, which lives outside the app and cannot be tapped with Espresso. */
export const declineFromAndroidLockScreen = async () => {
  await adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP');
  await assertAndroidLocked();
  await adb('shell', 'cmd', 'statusbar', 'expand-notifications');
  const declined = await waitUntil(
    async () => {
      // A full-screen call intent can close the shade after the first expansion.
      await adb('shell', 'cmd', 'statusbar', 'expand-notifications');
      // Reuse Detox's instrumentation rather than starting a competing UIAutomator process.
      const hierarchyPath =
        '/sdcard/Android/data/io.getstream.rnvideosample/files/callingx-e2e-window.xml';
      await device.getUiDevice().dumpWindowHierarchy(hierarchyPath);
      const xml = await adb('shell', 'cat', hierarchyPath);
      const row = incomingNotificationRow(xml);
      if (!row) return false;
      const nodes = row.match(/<node\b[^>]*>/g) ?? [];
      const decline = nodes.find(
        (candidate) =>
          /package="com\.android\.systemui"/.test(candidate) &&
          /(?:text|content-desc)="(?:Decline|Reject)"/i.test(candidate),
      );
      if (!decline) {
        const expand = nodes.find(
          (candidate) =>
            /resource-id="android:id\/expand_button"/.test(candidate) &&
            /content-desc="Expand"/.test(candidate),
        );
        if (expand) await tapNode(expand);
        return false;
      }
      await tapNode(decline);
      return true;
    },
    20_000,
    500,
  );
  if (!declined)
    throw new Error(
      'No native Decline/Reject action appeared on the lock screen',
    );
  await assertAndroidLocked();
};

/** Test devices must use swipe lock; this deliberately does not change or bypass a PIN. */
export const unlockAndroidScreen = async () => {
  await adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP');
  await adb('shell', 'cmd', 'statusbar', 'collapse');
  await adb('shell', 'wm', 'dismiss-keyguard');
};
