/** Internal commands whose completion the host must observe. */
export type WorkerRequest =
  | { type: 'cmd.init'; keyLength: number }
  | {
      type: 'cmd.set_key';
      userId: string;
      keyIndex: number;
      rawKey: ArrayBuffer;
    }
  | { type: 'cmd.set_shared_key'; keyIndex: number; rawKey: ArrayBuffer }
  | { type: 'cmd.remove_key'; userId: string; keyIndex: number }
  | { type: 'cmd.remove_shared_key'; keyIndex: number }
  | { type: 'cmd.remove_all_keys'; userId: string };

export type WorkerResult = {
  type: 'e2ee.command_result';
  requestId: number;
  error?: string;
};

/** A timeout leaves the applied key state unknown, so the worker is stopped. */
export const WORKER_TIMEOUT_MS = 10_000;
