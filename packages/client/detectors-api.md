# Audio Detectors API Documentation

## Overview

The Stream Video SDK provides audio detection capabilities to help identify microphone issues and monitor audio capture status. This document covers the implementation details of the no-audio detector system.

## Features

### No-Audio Detection

Automatically detects when a microphone is enabled but not capturing audio, which can indicate:

- Broken or malfunctioning microphone hardware
- Incorrect audio input device selected
- System-level audio permissions issues
- Disconnected or muted audio devices

The detector emits periodic events while no audio is detected and a final confirmation event when audio is successfully captured.

## Architecture

### Components

1. **Helper Module**: `src/helpers/no-audio-detector.ts`
   - Reusable audio analysis logic
   - Browser-based implementation using Web Audio API
   - Exported as public API for advanced use cases

2. **Integration Layer**: `src/devices/MicrophoneManager.ts`
   - Automatic lifecycle management via RxJS subscriptions
   - Watches microphone status and media stream changes
   - Auto-starts/stops detection on state transitions
   - Event dispatching to StreamVideoClient
   - Configurable silence threshold (default: 5000ms, 0 to disable)

3. **Event Type**: `src/coordinator/connection/types.ts`
   - Type-safe event definitions
   - Part of the StreamVideoEvent union

## API Usage

### Subscribing to Events

```typescript
// Subscribe to microphone capture reports
call.on('mic.capture_report', (event) => {
  if (event.capturesAudio) {
    console.log('✓ Microphone is capturing audio');
  } else {
    console.warn(
      `⚠ No audio detected for ${event.noAudioDurationMs}ms`,
      `Device: ${event.label} (${event.deviceId})`,
    );
  }
});
```

### Configuring Detection Threshold

```typescript
// Set custom silence threshold (default: 5000ms)
call.microphone.setSilenceThreshold(10000); // 10 seconds

// Disable no-audio detection entirely
call.microphone.setSilenceThreshold(0);

// Can be called at any time - will restart detection if mic is already enabled
await call.microphone.enable();
```

### Event Type Definition

```typescript
export type MicCaptureReportEvent = {
  type: 'mic.capture_report';

  // Whether the microphone is capturing audio
  capturesAudio: boolean;

  // Duration of continuous no-audio in milliseconds
  // Only present when capturesAudio is false
  noAudioDurationMs?: number;

  // The audio device associated with the stream
  deviceId?: string;
  label?: string;
};
```

## Implementation Details

### Browser Implementation

Uses Web Audio API for real-time frequency analysis:

```typescript
// Create audio analyzer
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256; // Optimized for voice detection

const microphone = audioContext.createMediaStreamSource(audioStream);
microphone.connect(analyser);

// Analyze frequency data
const data = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(data);
const hasAudio = data.some((value) => value >= threshold);
```

### React Native Implementation

Uses `RNSpeechDetector` for native audio analysis:

```typescript
const rnSpeechDetector = new RNSpeechDetector();
const unsubscribe = await rnSpeechDetector.start((event) => {
  if (event.isSoundDetected) {
    // Audio detected
  } else {
    // No audio detected
  }
});
```

### Detection Loop

Single interval-based detection with timing logic:

```typescript
const detectionIntervalId = setInterval(() => {
  const [audioTrack] = audioStream.getAudioTracks();

  // Skip if track is inactive
  if (!isAudioTrackActive(audioTrack)) {
    state.noAudioStartTime = null;
    state.lastEmitTime = null;
    return;
  }

  // Analyze audio levels
  const hasAudio = detectsAudio(analyser, audioLevelThreshold);

  if (!hasAudio) {
    // Handle no-audio state
    handleNoAudioDetected(state, audioTrack, options);
  } else {
    // Handle audio detected - stops detector automatically
    const shouldStop = handleAudioDetected(
      state,
      audioTrack,
      onCaptureStatusChange,
    );
    if (shouldStop) {
      clearInterval(detectionIntervalId);
    }
  }
}, detectionFrequencyInMs);
```

### Timing Logic

The detector uses two timing thresholds:

1. **Initial Threshold** (`noAudioThresholdMs`): Duration before first event (default: 5000ms)
2. **Emit Interval** (`emitIntervalMs`): Frequency of subsequent events (default: 5000ms)

```typescript
// First event after 5 seconds of silence
// Subsequent events every 5 seconds while silence continues
const shouldEmit =
  elapsed >= noAudioThresholdMs &&
  (!lastEmitTime || Date.now() - lastEmitTime >= emitIntervalMs);
```

### Auto-Stop Behavior

Detection automatically stops when audio is confirmed to save resources:

```typescript
function handleAudioDetected(state, audioTrack, onCaptureStatusChange) {
  const wasInNoAudioState = state.noAudioStartTime !== null;

  if (wasInNoAudioState) {
    // Emit final confirmation event
    onCaptureStatusChange({
      capturesAudio: true,
      deviceId: audioTrack?.getSettings().deviceId,
      label: audioTrack?.label,
    });
  }

  // Reset state
  state.noAudioStartTime = null;
  state.lastEmitTime = null;

  // Signal to stop detector
  return wasInNoAudioState;
}
```

### Auto-Restart Triggers

Detection automatically restarts using a reactive pattern that watches both microphone status and media stream:

```typescript
this.subscriptions.push(
  createSafeAsyncSubscription(
    combineLatest([this.state.status$, this.state.mediaStream$]),
    async ([status, mediaStream]) => {
      // Always cleanup existing detector first
      if (this.noAudioDetectorCleanup) {
        const cleanup = this.noAudioDetectorCleanup;
        this.noAudioDetectorCleanup = undefined;
        await cleanup().catch((err) => {
          this.logger.warn('Failed to stop no-audio detector', err);
        });
      }

      // Early return if detection shouldn't run
      if (status !== 'enabled' || !mediaStream) return;
      if (this.silenceThresholdMs <= 0) return;

      // Start detection
      this.noAudioDetectorCleanup = createNoAudioDetector(mediaStream, {
        noAudioThresholdMs: this.silenceThresholdMs,
        emitIntervalMs: this.silenceThresholdMs,
        onCaptureStatusChange: (event) => {
          this.call.streamClient.dispatchEvent({
            type: 'mic.capture_report',
            ...event,
          });
        },
      });
    },
  ),
);
```

This pattern ensures detection restarts when:

1. **Microphone is enabled/disabled** - `status$` changes
2. **Device is switched** - `mediaStream$` changes to new device's stream
3. **Threshold is reconfigured** - When `silenceThresholdMs` changes from disabled to enabled

The `combineLatest` pattern guarantees both values are current, preventing race conditions.

## Configuration Options

### NoAudioDetectorOptions

```typescript
export type NoAudioDetectorOptions = {
  // How often to check for audio (default: 500ms)
  detectionFrequencyInMs?: number;

  // Audio level threshold 0-255 (default: 5)
  // Values below this are considered no audio
  audioLevelThreshold?: number;

  // Duration before first event (default: 5000ms)
  noAudioThresholdMs?: number;

  // Interval between events (default: same as threshold)
  emitIntervalMs?: number;

  // FFT size for frequency analysis (default: 256)
  // Must be power of 2 between 32-32768
  fftSize?: number;

  // Callback for capture status changes
  onCaptureStatusChange: (event: CaptureStatusEvent) => void;
};
```

### FFT Size Selection

FFT size affects frequency resolution and latency:

- **128**: Fast but may miss lower frequencies
- **256**: ✓ Recommended - optimal for voice detection (80 Hz - 11 kHz)
- **512**: Higher resolution but slower, unnecessary for voice
- **1024+**: Overkill for voice detection, increases latency

The default of 256 provides:

- Frequency resolution: ~86 Hz per bin (22050 Hz / 256)
- Latency: ~11.6ms per analysis
- Coverage: 80 Hz to 11 kHz (captures full voice range)

### Audio Level Threshold

The threshold determines what audio levels are considered "no audio":

- **Range**: 0-255 (8-bit unsigned values from FFT)
- **Default**: 5
- **Typical voice**: 20-100 when speaking normally
- **Background noise**: Usually 1-10
- **Silence**: 0-5

Setting too high may trigger false positives during quiet speech.

## Helper Function Architecture

The implementation is decomposed into single-purpose functions:

### Track Status

```typescript
// Checks if track is enabled and ready
function isAudioTrackActive(audioTrack?: MediaStreamTrack): boolean {
  return !!(audioTrack?.enabled && audioTrack.readyState !== 'ended');
}
```

### Audio Analysis

```typescript
// Analyzes frequency data to detect audio
function hasAudio(analyser: AnalyserNode, threshold: number): boolean {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data.some((value) => value >= threshold);
}
```

### Metadata Extraction

```typescript
// Extracts device info from track
function getTrackMetadata(audioTrack?: MediaStreamTrack): TrackMetadata {
  return {
    deviceId: audioTrack?.getSettings().deviceId,
    label: audioTrack?.label,
  };
}
```

### Timing Logic

```typescript
// Determines if enough time elapsed to emit event
function shouldEmitNoAudioEvent(
  state: DetectionState,
  options: NoAudioDetectorOptions,
): boolean {
  if (state.noAudioStartTime === null) return false;

  const elapsed = Date.now() - state.noAudioStartTime;
  const timeSinceLastEmit = state.lastEmitTime
    ? Date.now() - state.lastEmitTime
    : Infinity;

  return (
    elapsed >= options.noAudioThresholdMs &&
    timeSinceLastEmit >= options.emitIntervalMs
  );
}
```

### State Management

```typescript
// Handles no-audio detection state
function handleNoAudioDetected(
  state: DetectionState,
  options: NoAudioDetectorOptions,
): CaptureStatusEvent | undefined {
  // Initialize timing on first detection
  if (state.noAudioStartTime === null) {
    state.noAudioStartTime = Date.now();
    state.lastEmitTime = null;
  }

  if (!shouldEmitNoAudioEvent(state, options)) return;

  const elapsed = Date.now() - state.noAudioStartTime!;
  state.lastEmitTime = Date.now();

  return {
    capturesAudio: false,
    noAudioDurationMs: elapsed,
  };
}

// Handles audio detected state
function handleAudioDetected(
  state: DetectionState,
): CaptureStatusEvent | undefined {
  const wasInNoAudioState = state.noAudioStartTime !== null;

  if (wasInNoAudioState) {
    // Emit success event
    state.noAudioStartTime = null;
    state.lastEmitTime = null;
    return { capturesAudio: true };
  }

  return undefined; // No event needed
}
```

### Resource Management

```typescript
// Creates audio analyzer
function createAudioAnalyzer(audioStream: MediaStream, fftSize: number) {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const microphone = audioContext.createMediaStreamSource(audioStream);
  microphone.connect(analyser);

  return { audioContext, analyser };
}

// Cleanup function
async function stop() {
  clearInterval(detectionIntervalId);
  if (audioContext.state !== 'closed') {
    await audioContext.close();
  }
}
```

## Concurrency Control

No explicit concurrency control is needed for no-audio detection because RxJS subscriptions provide built-in serial execution:

```typescript
// RxJS guarantees the subscription callback runs serially
createSafeAsyncSubscription(
  combineLatest([this.state.status$, this.state.mediaStream$]),
  async ([status, mediaStream]) => {
    // This callback is guaranteed to run one at a time
    // Even if status$ or mediaStream$ emit multiple times quickly,
    // each execution waits for the previous one to complete
  },
);
```

**Key benefits of this approach:**

- Eliminates need for manual concurrency tags
- Cleanup always runs before starting new detector
- Simpler code with fewer abstraction layers
- RxJS handles queuing and execution order automatically

**Note:** The speaking-while-muted detection still uses `withoutConcurrency` because it needs finer-grained control over concurrent microphone stream creation.

## Platform Differences

### Browser

- Uses Web Audio API (AudioContext, AnalyserNode)
- Direct frequency analysis of MediaStream
- Synchronous audio level detection
- Auto-stops on audio detection

### React Native

- Uses `RNSpeechDetector` native module
- Callback-based detection events
- Manual interval for periodic emission
- Same event format and timing behavior

## Event Flow

### No-Audio Scenario

```
1. User enables microphone
2. Detection starts (500ms interval)
3. No audio detected for 5 seconds
   → Event: { capturesAudio: false, noAudioDurationMs: 5000 }
4. Still no audio after 10 seconds
   → Event: { capturesAudio: false, noAudioDurationMs: 10000 }
5. Pattern continues every 5 seconds...
```

### Audio Detected Scenario

```
1. User enables microphone
2. Detection starts (500ms interval)
3. No audio detected for 3 seconds
4. Audio suddenly detected
   → Event: { capturesAudio: true }
5. Detection automatically stops
6. Resources freed (AudioContext closed, interval cleared)
```

### Device Change Scenario

```
1. User has mic enabled with audio detected (detector stopped)
2. User switches to different microphone
3. Detection automatically restarts
4. New device validated
   → Event: { capturesAudio: true } when audio detected
5. Detection stops again
```

## Memory Management

### Resource Cleanup

```typescript
// Cleanup function returned by createNoAudioDetector
return async function stop() {
  // Clear detection interval
  clearInterval(detectionIntervalId);

  // Close AudioContext (releases audio processing resources)
  if (audioContext.state !== 'closed') {
    await audioContext.close();
  }
};
```

### Automatic Cleanup Triggers

1. Audio detected (auto-stop)
2. Microphone disabled
3. MicrophoneManager disposed
4. Call ended

## Error Handling

### AudioContext Not Available

```typescript
// Browser guard (e.g., in test environments)
if (typeof AudioContext === 'undefined') {
  this.logger.debug('AudioContext not available, skipping detection');
  return;
}
```

### Track Inactive

```typescript
// Skip detection if track is disabled or ended
if (!isAudioTrackActive(audioTrack)) {
  state.noAudioStartTime = null;
  state.lastEmitTime = null;
  return;
}
```

### Exception Handling

Cleanup errors are caught and logged to prevent detection failures from affecting other functionality:

```typescript
// Cleanup with error handling
if (this.noAudioDetectorCleanup) {
  const cleanup = this.noAudioDetectorCleanup;
  this.noAudioDetectorCleanup = undefined;
  await cleanup().catch((err) => {
    this.logger.warn('Failed to stop no-audio detector', err);
  });
}
```

The RxJS subscription uses `createSafeAsyncSubscription`, which automatically catches and logs any unhandled errors in the callback, preventing them from breaking the subscription.

## Testing Considerations

### Unit Testing

The helper functions are pure and testable in isolation:

```typescript
// Example test cases
expect(isAudioTrackActive(enabledTrack)).toBe(true);
expect(isAudioTrackActive(disabledTrack)).toBe(false);
expect(hasAudio(analyser, 5)).toBe(true);
```

### Integration Testing

Mock the detector in tests to avoid AudioContext:

```typescript
// Mock in __tests__/setup/
vi.mock('../helpers/no-audio-detector', () => ({
  createNoAudioDetector: vi.fn(() => vi.fn()),
}));
```

### Manual Testing

1. Enable microphone
2. Wait 5 seconds without speaking
3. Verify `mic.capture_report` event with `capturesAudio: false`
4. Speak into microphone
5. Verify event with `capturesAudio: true`
6. Confirm no more events after audio detected

## Performance Characteristics

### CPU Usage

- Detection interval: 500ms (2 Hz)
- FFT analysis: ~1-2ms per check
- Minimal CPU impact (~0.2-0.4% on modern hardware)

### Memory Usage

- AudioContext: ~500KB
- AnalyserNode: ~16KB (for fftSize=256)
- Total: <1MB per active detector

### Network Impact

- No network usage (local audio analysis only)
- Events dispatched locally through StreamVideoClient

## Advanced Usage

### Direct Helper Usage

For advanced use cases, the helper can be used directly:

```typescript
import { createNoAudioDetector } from '@stream-io/video-client';

// Get audio stream
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Start detection
const stop = createNoAudioDetector(stream, {
  noAudioThresholdMs: 3000,
  emitIntervalMs: 1000,
  audioLevelThreshold: 10,
  onCaptureStatusChange: (event) => {
    console.log('Capture status:', event);
  },
});

// Later: stop detection
await stop();
```

### Custom Threshold Configuration

```typescript
// Sensitive detection (triggers faster)
call.microphone.setSilenceThreshold(2000); // 2 seconds

// Tolerant detection (avoids false positives during pauses)
call.microphone.setSilenceThreshold(10000); // 10 seconds

// Disable detection (no events will be emitted)
call.microphone.setSilenceThreshold(0);
```

## Related Features

### Speaking While Muted Detection

Uses `sound-detector.ts` for similar audio analysis:

- Detects when user speaks while muted
- Triggers UI notification
- Uses same Web Audio API approach

### Noise Cancellation

Compatible with noise cancellation:

- Detection runs after NC processing
- Analyzes final output audio
- NC doesn't interfere with detection

## Future Enhancements

Potential improvements:

- Adaptive threshold based on ambient noise
- Volume level reporting in events
- Detection quality metrics (SNR, clipping)
- Per-frequency analysis for debugging
- Audio waveform visualization data
