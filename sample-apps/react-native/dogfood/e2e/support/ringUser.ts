import { execFile } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';

/**
 * Rings `userId` from a caller who never joins (`ringAndDisappear.mjs`) and returns the ringing
 * call's id, so a test can read the call from the server and send stream-video-buddy into it as
 * the other participant once the user accepts.
 *
 * @param byPush waits until the user's app has registered for push before ringing, for a ring
 * that must arrive by push.
 */
export const ringUser = async (
  userId: string,
  { byPush = false } = {},
): Promise<string> => {
  const script = join(__dirname, 'ringAndDisappear.mjs');
  const args = byPush ? [userId, '--wait-for-push-device'] : [userId];
  try {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      [script, ...args],
      { timeout: 90_000, encoding: 'utf8' },
    );
    const callId = stdout.trim().split('\n').pop()?.trim();
    if (!callId) {
      throw new Error('the ring script printed no call id');
    }
    return callId;
  } catch (error) {
    const { stderr } = error as { stderr?: string };
    throw new Error(
      `Could not ring ${userId}: ${stderr?.trim() || String(error)}`,
    );
  }
};
