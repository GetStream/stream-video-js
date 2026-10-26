let tracksTransferable: boolean | undefined;

/**
 * Whether a MediaStreamTrack can be transferred to a dedicated worker, which
 * is where Safari (18+) exposes MediaStreamTrackProcessor and
 * VideoTrackGenerator. Probed once, by transferring a canvas-captured track
 * through a MessageChannel: browsers that don't support it throw a
 * DataCloneError. No user agent sniffing involved.
 */
export const canTransferTracks = (): boolean => {
  if (tracksTransferable !== undefined) return tracksTransferable;
  tracksTransferable = false;
  if (
    typeof document === 'undefined' ||
    typeof MessageChannel === 'undefined'
  ) {
    return false;
  }
  const canvas = document.createElement('canvas');
  if (typeof canvas.captureStream !== 'function') return false;
  const [track] = canvas.captureStream().getVideoTracks();
  if (!track) return false;
  const channel = new MessageChannel();
  try {
    channel.port1.postMessage(track, [track]);
    tracksTransferable = true;
  } catch {
    tracksTransferable = false;
  } finally {
    channel.port1.close();
    channel.port2.close();
    track.stop();
  }
  return tracksTransferable;
};
