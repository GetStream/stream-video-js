class StereoCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.chunkSize = options?.processorOptions?.chunkSize || 2048;
    this.bufL = [];
    this.bufR = [];
    this.len = 0;
    this.channels = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    this.channels = input.length;
    const left = input[0] || new Float32Array(128);
    const right = input[1] || left;

    this.bufL.push(new Float32Array(left));
    this.bufR.push(new Float32Array(right));
    this.len += left.length;

    if (this.len >= this.chunkSize) {
      const L = new Float32Array(this.len);
      const R = new Float32Array(this.len);
      let o = 0;
      for (const a of this.bufL) {
        L.set(a, o);
        o += a.length;
      }
      o = 0;
      for (const a of this.bufR) {
        R.set(a, o);
        o += a.length;
      }

      this.port.postMessage(
        {
          left: L,
          right: R,
          sampleRate,
          inputChannels: this.channels,
        },
        [L.buffer, R.buffer],
      );

      this.bufL.length = 0;
      this.bufR.length = 0;
      this.len = 0;
    }
    return true;
  }
}
registerProcessor('stereo-capture', StereoCaptureProcessor);
