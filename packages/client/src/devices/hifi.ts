export const withHifiAudio = async (
  stream: MediaStream,
): Promise<MediaStream> => {
  const originalAudioTrack = stream.getAudioTracks()[0];
  if (!originalAudioTrack) {
    throw new Error('No audio track in the display capture.');
  }

  // Create audio context if not exists
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule('/stereo-processor.js');

  // Resume audio context if suspended
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Create media stream source from the screen capture
  const screenSource = ctx.createMediaStreamSource(
    new MediaStream([originalAudioTrack]),
  );

  // Create a destination for processed stereo audio
  const dest = ctx.createMediaStreamDestination();

  // Create a stereo splitter and merger to ensure proper stereo processing
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  // Create gain nodes for each channel to ensure proper stereo separation
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  leftGain.gain.value = 1.0;
  rightGain.gain.value = 1.0;

  // Route the audio: source -> splitter -> gains -> merger -> destination
  screenSource.connect(splitter);
  splitter.connect(leftGain, 0); // Left channel
  splitter.connect(rightGain, 1); // Right channel
  leftGain.connect(merger, 0, 0); // Left gain to left output
  rightGain.connect(merger, 0, 1); // Right gain to right output
  merger.connect(dest);

  // Get the processed audio track
  const audioTrack = dest.stream.getAudioTracks()[0];
  return new MediaStream([audioTrack, ...stream.getVideoTracks()]);
};
