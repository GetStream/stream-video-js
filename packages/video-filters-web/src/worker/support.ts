let tracksTransferable: boolean | undefined;

/**
 * Whether a MediaStreamTrack can be transferred to a worker (Safari 18+).
 * Probed once by posting a canvas track through a MessageChannel;
 * browsers without support throw a DataCloneError.
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
