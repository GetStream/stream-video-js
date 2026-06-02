/**
 * Document (de)serialization and the snapshot chunker. A full document can
 * exceed the ~5KB custom-event cap, so snapshots are split into chunks that are
 * paced through the outbound funnel and reassembled by the receiver. Chunks are
 * never parsed individually: only the reassembled whole is valid JSON, so a
 * multibyte character split across a boundary rejoins correctly.
 */
import type { WhiteboardDocument } from './model';

export const serialize = (doc: WhiteboardDocument): string =>
  JSON.stringify(doc);

export const deserialize = (data: string): WhiteboardDocument | null => {
  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.epoch !== 'number') return null;
    if (typeof parsed.elements !== 'object' || parsed.elements === null) {
      return null;
    }
    return parsed as WhiteboardDocument;
  } catch {
    return null;
  }
};

/**
 * Chunk size in characters. Kept comfortably under the ~5KB cap so the chunk,
 * once wrapped in the snapshot envelope and JSON-escaped, still fits.
 */
export const DEFAULT_CHUNK_SIZE = 4000;

export const chunk = (data: string, size = DEFAULT_CHUNK_SIZE): string[] => {
  if (data.length <= size) return [data];
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }
  return chunks;
};

export const reassemble = (chunks: string[]): string => chunks.join('');
