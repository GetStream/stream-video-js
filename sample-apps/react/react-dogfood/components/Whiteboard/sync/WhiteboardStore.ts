/**
 * Persistence seam. v1 ships ephemeral (no store): the board lives only in
 * peer memory and is reconstructed for late joiners from a peer snapshot, so it
 * is lost when the last participant leaves. Providing a WhiteboardStore (Phase
 * 2, e.g. RestWhiteboardStore backed by pages/api/whiteboard/[callId].ts) adds
 * durable persistence without touching the sync layer.
 */
import type { WhiteboardDocument } from '../core/model';

export interface WhiteboardStore {
  load(callCid: string): Promise<WhiteboardDocument | null>;
  save(callCid: string, doc: WhiteboardDocument): Promise<void>;
}
