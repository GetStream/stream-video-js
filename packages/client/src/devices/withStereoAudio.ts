export const withStereoAudio = async (
  stream: MediaStream,
): Promise<MediaStream> => {
  const originalAudioTrack = stream.getAudioTracks()[0];
  if (!originalAudioTrack) {
    throw new Error('No audio track in the display capture.');
  }

  // Create audio context if not exists
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(getStereoProcessorWorkletModule());

  // Resume audio context if suspended
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Create media stream source from the screen capture
  const source = ctx.createMediaStreamSource(
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
  source.connect(splitter);
  splitter.connect(leftGain, 0); // Left channel
  splitter.connect(rightGain, 1); // Right channel
  leftGain.connect(merger, 0, 0); // Left gain to left output
  rightGain.connect(merger, 0, 1); // Right gain to right output
  merger.connect(dest);

  // Get the processed audio track
  const audioTrack = dest.stream.getAudioTracks()[0];
  return new MediaStream([audioTrack, ...stream.getVideoTracks()]);
};

// Cache the worklet blob URL to avoid creating it multiple times
// TODO OL: find an elegant way to release the URL object when it's no longer needed
let cachedWorkletUrl: string | undefined;

/**
 * Returns a URL to a worklet module that processes stereo audio.
 */
const getStereoProcessorWorkletModule = (): string => {
  // minified version of the StereoCaptureProcessor code below (https://try.terser.org/)
  if (!cachedWorkletUrl) {
    const code = `class t extends AudioWorkletProcessor{constructor(t){super(),this.chunkSize=t?.processorOptions?.chunkSize||2048,this.bufL=[],this.bufR=[],this.len=0,this.channels=0}process(t){const s=t[0];if(!s||0===s.length)return!0;this.channels=s.length;const e=s[0]||new Float32Array(128),n=s[1]||e;if(this.bufL.push(new Float32Array(e)),this.bufR.push(new Float32Array(n)),this.len+=e.length,this.len>=this.chunkSize){const t=new Float32Array(this.len),s=new Float32Array(this.len);let e=0;for(const s of this.bufL)t.set(s,e),e+=s.length;e=0;for(const t of this.bufR)s.set(t,e),e+=t.length;this.port.postMessage({left:t,right:s,sampleRate:sampleRate,inputChannels:this.channels},[t.buffer,s.buffer]),this.bufL.length=0,this.bufR.length=0,this.len=0}return!0}}registerProcessor("stereo-capture",t);`;
    const blob = new Blob([code], { type: 'application/javascript' });
    cachedWorkletUrl = URL.createObjectURL(blob);
  }
  return cachedWorkletUrl;
};

// class StereoCaptureProcessor extends AudioWorkletProcessor {
//   constructor(options) {
//     super();
//     this.chunkSize = options?.processorOptions?.chunkSize || 2048;
//     this.bufL = [];
//     this.bufR = [];
//     this.len = 0;
//     this.channels = 0;
//   }
//
//   process(inputs) {
//     const input = inputs[0];
//     if (!input || input.length === 0) return true;
//
//     this.channels = input.length;
//     const left = input[0] || new Float32Array(128);
//     const right = input[1] || left;
//
//     this.bufL.push(new Float32Array(left));
//     this.bufR.push(new Float32Array(right));
//     this.len += left.length;
//
//     if (this.len >= this.chunkSize) {
//       const L = new Float32Array(this.len);
//       const R = new Float32Array(this.len);
//       let o = 0;
//       for (const a of this.bufL) {
//         L.set(a, o);
//         o += a.length;
//       }
//       o = 0;
//       for (const a of this.bufR) {
//         R.set(a, o);
//         o += a.length;
//       }
//
//       this.port.postMessage(
//         {
//           left: L,
//           right: R,
//           sampleRate,
//           inputChannels: this.channels,
//         },
//         [L.buffer, R.buffer],
//       );
//
//       this.bufL.length = 0;
//       this.bufR.length = 0;
//       this.len = 0;
//     }
//     return true;
//   }
// }
//
// registerProcessor('stereo-capture', StereoCaptureProcessor);
