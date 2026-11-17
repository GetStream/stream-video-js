import { adb } from './AndroidSystemDialogs';

/**
 * The parts of UiAutomator's `UiDevice` this file uses. Detox exposes it through
 * `device.getUiDevice()` on Android, but its type definitions don't declare that method.
 */
type UiDevice = {
  dumpWindowHierarchy(fileName: string): Promise<unknown>;
};

const uiDevice = () =>
  (device as unknown as { getUiDevice(): UiDevice }).getUiDevice();

const appPackage = 'io.getstream.rnvideosample';

/**
 * Where the window hierarchy is dumped. `dumpWindowHierarchy` runs in the app's process (the Detox
 * instrumentation), so it can write to the app's external files folder, and `adb` can read it from
 * there. Running `adb shell uiautomator dump` instead would start a second UiAutomation connection
 * and disconnect Detox's.
 */
const dumpFolder = `/sdcard/Android/data/${appPackage}/files`;
const dumpFile = `${dumpFolder}/e2e-window.xml`;

export type Point = { x: number; y: number };

/** The centre of every node whose text or content description is `label` (any case). */
const findNodesLabelled = (xml: string, label: string): Point[] => {
  const wanted = label.toLowerCase();
  const points: Point[] = [];
  for (const [node] of xml.matchAll(/<node [^>]*>/g)) {
    const text = /\btext="([^"]*)"/.exec(node)?.[1] ?? '';
    const description = /\bcontent-desc="([^"]*)"/.exec(node)?.[1] ?? '';
    if (text.toLowerCase() !== wanted && description.toLowerCase() !== wanted) {
      continue;
    }
    const bounds = /\bbounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(node);
    if (!bounds) {
      continue;
    }
    const [left, top, right, bottom] = bounds.slice(1).map(Number);
    points.push({ x: (left + right) / 2, y: (top + bottom) / 2 });
  }
  return points;
};

/** Opens the notification shade and returns its window hierarchy as UiAutomator XML. */
const readShade = async () => {
  // Not `uiDevice().openNotification()`: on some devices (Samsung One UI) it toggles the shade,
  // so calling it while the shade is already open closes it. Closing it first and then opening
  // it starts every read from the same, open, state.
  adb('shell', 'cmd', 'statusbar', 'collapse');
  await new Promise((resolve) => setTimeout(resolve, 500));
  adb('shell', 'cmd', 'statusbar', 'expand-notifications');
  // Give the shade time to finish opening, so the dump has the notifications in place.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  adb('shell', 'mkdir', '-p', dumpFolder);
  await uiDevice().dumpWindowHierarchy(dumpFile);
  return adb('exec-out', 'cat', dumpFile);
};

/**
 * The incoming call notification (callingx's CallStyle notification) has Answer and Decline
 * buttons. Returns where its Decline button is, or `undefined` when no incoming call notification
 * is showing.
 */
export const findIncomingCallDeclineButton = async (): Promise<
  Point | undefined
> => {
  const xml = await readShade();
  return findNodesLabelled(xml, 'Decline')[0];
};

/**
 * Whether the app has an incoming call notification posted, asked from Android's notification
 * service rather than read from the shade. Reading the shade isn't reliable enough for a check
 * that repeats: some devices close it or show it half-open between reads.
 *
 * callingx's incoming call notification is a CallStyle notification with a Decline action.
 */
export const isIncomingCallNotificationPosted = () =>
  adb('shell', 'dumpsys', 'notification', '--noredact')
    .split(/\n\s*NotificationRecord\(/)
    .slice(1)
    .some(
      (record) =>
        record.includes(`pkg=${appPackage}`) &&
        (/android\.callType=Integer \(1\)/.test(record) ||
          /"Decline"/.test(record)),
    );

/**
 * Taps a point on the screen, e.g. a button in the notification shade. Through `adb shell input`
 * rather than `uiDevice().click()`: the shell user may tap on other apps' windows, while the Detox
 * instrumentation runs in the app and needs INJECT_EVENTS for that, which some devices (MIUI)
 * refuse unless a security setting is turned on.
 */
export const tapOnScreen = async ({ x, y }: Point) => {
  adb('shell', 'input', 'tap', String(Math.round(x)), String(Math.round(y)));
};

/** Closes the notification shade, if it is open. */
export const closeNotificationShade = () => {
  adb('shell', 'cmd', 'statusbar', 'collapse');
};
