import { E2EE_VERSION, MAGIC, RBSP_FLAG, TRAILER_LEN } from './constants';
import type { Trailer } from './types';

const msgQueue: Array<() => Promise<void>> = [];
let msgQueueRunning = false;

/**
 * Serialize async tasks to prevent races between key operations and
 * transform setup (e.g. `setKey` arriving while `ensureIVPrefix` is in-flight).
 */
export const enqueue = async (fn: () => Promise<void>) => {
  msgQueue.push(fn);
  if (msgQueueRunning) return;
  msgQueueRunning = true;
  while (msgQueue.length > 0) {
    const task = msgQueue.shift()!;
    try {
      await task();
    } catch (e: any) {
      self.postMessage({
        type: 'error',
        message: `Queue task error: ${e?.message || e}`,
      });
    }
  }
  msgQueueRunning = false;
};

/**
 * Trailer layout (12 bytes):
 * [4B frameCounter][1B keyIndex][2B clearBytes|flags][1B version][4B magic]
 */
export const writeTrailer = (
  dst: Uint8Array,
  offset: number,
  frameCounter: number,
  keyIndex: number,
  clearBytes: number,
  isRbsp: boolean,
) => {
  const view = new DataView(dst.buffer, dst.byteOffset, dst.byteLength);
  view.setUint32(offset, frameCounter);
  dst[offset + 4] = keyIndex;
  view.setUint16(offset + 5, isRbsp ? clearBytes | RBSP_FLAG : clearBytes);
  dst[offset + 7] = E2EE_VERSION;
  view.setUint32(offset + 8, MAGIC);
};

export const readTrailer = (src: Uint8Array): Trailer | null => {
  if (src.length < TRAILER_LEN) return null;
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
  if (view.getUint32(src.length - 4) !== MAGIC) return null;
  const raw = view.getUint16(src.length - 7);
  return {
    frameCounter: view.getUint32(src.length - TRAILER_LEN),
    keyIndex: src[src.length - 8],
    clearBytes: raw & 0x7fff,
    isRbsp: (raw & RBSP_FLAG) !== 0,
    version: src[src.length - 5],
  };
};
