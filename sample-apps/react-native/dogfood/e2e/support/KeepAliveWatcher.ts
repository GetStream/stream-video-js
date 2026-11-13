import {
  E2E_JS_HEARTBEAT_INTERVAL_MS,
  E2E_JS_HEARTBEAT_TAG,
} from '../../src/constants/e2e';
import {
  collectJsLogs,
  deviceNowMs,
  lockScreen,
  type LogLine,
  pressHome,
} from './Adb';
import { getSessionParticipants, waitForUserOnCall } from './StreamCallApi';

/**
 * How long the app stays away from the user (screen locked or app in the background) in the
 * keep-alive tests. A minute is enough: without a keep-alive task React Native pauses JS timers
 * as soon as the app leaves the foreground, so the heartbeat stops within one tick. Raise it with
 * `E2E_AWAY_SECONDS` to check longer stays, e.g. `E2E_AWAY_SECONDS=240`.
 */
export const awayDurationMs = Number(process.env.E2E_AWAY_SECONDS ?? 60) * 1000;

/**
 * The longest gap allowed between two heartbeats. Three ticks: a busy device can be late by a tick
 * or two without the timers having stopped.
 */
const maxHeartbeatGapMs = 3 * E2E_JS_HEARTBEAT_INTERVAL_MS + 2_000;

/** How often the server is asked who is on the call while the app is away. */
const serverPollMs = 10_000;

export type AwayMode = 'screen locked' | 'app in the background';

type ServerSample = {
  atMs: number;
  callId: string;
  userSessionId?: string;
  error?: string;
};

export type AwayReport = {
  mode: AwayMode;
  userId: string;
  /** Device clock, so it can be compared with logcat. */
  startMs: number;
  endMs: number;
  heartbeats: LogLine[];
  /** The user's session on each call right before the app went away. */
  sessionsBefore: Record<string, string>;
  samples: ServerSample[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeRegex = (text: string) =>
  text.replace(/[[\]().*+?^$|\\{}]/g, '\\$&');

/** Starts collecting the app's JS heartbeat lines from logcat; `stop()` returns them. */
export const collectHeartbeats = () =>
  collectJsLogs(escapeRegex(E2E_JS_HEARTBEAT_TAG));

/**
 * Sends the app away (locks the screen, or goes to the home screen) for `durationMs`, and records
 * what happens meanwhile:
 * - the app's JS heartbeat lines from logcat, which stop when JS timers stop;
 * - every `serverPollMs`, the user's session on each call, from the server.
 *
 * It leaves the app away; the test brings it back (unlocks the screen or opens the app). The
 * asserts below check the report.
 */
export const stayAwayFromTheApp = async ({
  mode,
  userId,
  callIds,
  durationMs = awayDurationMs,
}: {
  mode: AwayMode;
  userId: string;
  callIds: string[];
  durationMs?: number;
}): Promise<AwayReport> => {
  const sessionsBefore: Record<string, string> = {};
  for (const callId of callIds) {
    sessionsBefore[callId] = (
      await waitForUserOnCall(callId, userId)
    ).userSessionId;
  }

  const logs = collectHeartbeats();
  // let logcat attach before the window starts
  await sleep(1_500);

  const startMs = await deviceNowMs();
  if (mode === 'screen locked') {
    await lockScreen();
  } else {
    await pressHome();
  }

  const samples: ServerSample[] = [];
  const deadline = Date.now() + durationMs;
  while (Date.now() < deadline) {
    await sleep(Math.min(serverPollMs, Math.max(0, deadline - Date.now())));
    for (const callId of callIds) {
      const atMs = Date.now();
      try {
        const participants = await getSessionParticipants(callId, userId);
        samples.push({
          atMs,
          callId,
          userSessionId: participants.find((p) => p.userId === userId)
            ?.userSessionId,
        });
      } catch (error) {
        // A network hiccup on the host is not the app's fault; record it and keep going.
        samples.push({ atMs, callId, error: String(error) });
      }
    }
  }

  const endMs = await deviceNowMs();
  // a heartbeat from right before the end can take a moment to reach the host
  await sleep(1_000);
  const heartbeats = logs.stop();

  return {
    mode,
    userId,
    startMs,
    endMs,
    heartbeats,
    sessionsBefore,
    samples,
  };
};

const describeSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/**
 * Checks that JS timers kept firing the whole time the app was away: heartbeats came in from the
 * start to the end of the window with no gap longer than three ticks, and at least one of them
 * was logged while the app was not in the foreground.
 */
export const assertJsKeptRunning = (report: AwayReport) => {
  const { startMs, endMs } = report;
  const beats = report.heartbeats
    .filter((line) => line.timeMs >= startMs && line.timeMs <= endMs)
    .sort((a, b) => a.timeMs - b.timeMs);

  if (beats.length === 0) {
    throw new Error(
      `No JS heartbeat in the ${describeSeconds(endMs - startMs)} the ${report.mode}: JS timers stopped. ` +
        `(Heartbeats seen outside the window: ${report.heartbeats.length}. If none at all, check that the ` +
        `signed-in user id starts with "e2e_".)`,
    );
  }

  const times = [startMs, ...beats.map((b) => b.timeMs), endMs];
  let longestGap = 0;
  let gapStart = startMs;
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1];
    if (gap > longestGap) {
      longestGap = gap;
      gapStart = times[i - 1];
    }
  }
  if (longestGap > maxHeartbeatGapMs) {
    throw new Error(
      `JS timers stopped for ${describeSeconds(longestGap)} with the ${report.mode}, ` +
        `${describeSeconds(gapStart - startMs)} after it started (allowed: ${describeSeconds(maxHeartbeatGapMs)}). ` +
        `Heartbeats: ${beats.map((b) => describeSeconds(b.timeMs - startMs)).join(', ')}`,
    );
  }

  const awayBeats = beats.filter((b) => !/appState=active/.test(b.message));
  if (awayBeats.length === 0) {
    throw new Error(
      `Every heartbeat says appState=active, so the app never left the foreground. ` +
        `The test did not put it in the ${report.mode}.`,
    );
  }
};

/**
 * Checks that the server saw the user on every call for the whole time the app was away, in the
 * same session as before. A new session means the user was dropped and the SDK joined again.
 */
export const assertStayedOnCall = (report: AwayReport) => {
  const problems: string[] = [];
  for (const [callId, sessionBefore] of Object.entries(report.sessionsBefore)) {
    const samples = report.samples.filter((s) => s.callId === callId);
    const answered = samples.filter((s) => s.error === undefined);
    if (answered.length === 0) {
      problems.push(
        `call ${callId}: the server never answered (${samples[0]?.error ?? 'no samples'})`,
      );
      continue;
    }
    for (const sample of answered) {
      const at = describeSeconds(sample.atMs - answered[0].atMs + serverPollMs);
      if (!sample.userSessionId) {
        problems.push(
          `call ${callId}: ${report.userId} was not on the call at ~${at}`,
        );
      } else if (sample.userSessionId !== sessionBefore) {
        problems.push(
          `call ${callId}: ${report.userId} was on the call in a new session at ~${at}, so they were dropped and joined again`,
        );
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(
      `With the ${report.mode}, the user did not stay on the call:\n  ${problems.join('\n  ')}`,
    );
  }
};

/** Both checks: the user stayed on every call, and JS kept running. */
export const assertCallStayedAlive = (report: AwayReport) => {
  assertStayedOnCall(report);
  assertJsKeptRunning(report);
};
