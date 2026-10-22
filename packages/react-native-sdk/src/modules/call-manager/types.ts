export type AudioDeviceEndpointType =
  | 'Bluetooth Device'
  | 'Earpiece'
  | 'Speaker'
  | 'Wired Headset'
  | 'Unknown'
  | (string & {});

/**
 * A selectable audio output device.
 *
 * Devices are identified by a stable {@link AudioDevice.id} — never by name —
 * so two devices that share a display name (e.g. two "AirPods Pro") never
 * collide. On iOS the id is the `AVAudioSessionPortDescription.uid`
 * (or the synthetic `'speaker'` / `'earpiece'` for the built-in outputs).
 * On Android it is the `AudioDeviceInfo.id` for SDK-managed routing, or the
 * Telecom endpoint id (a `CallEndpointCompat` identifier) when the call is
 * Telecom-managed via callingx — stable for the lifetime of that call.
 */
export type AudioDevice = {
  /** Stable, unique device identifier. Pass this to `callManager.audioDevices.select()`. */
  id: string;
  /** Human-readable label for display (e.g. "AirPods Pro", "Speaker"). Not stable — do not use as a key. */
  name: string;
  /** The kind of endpoint, useful for picking an icon. */
  type: AudioDeviceEndpointType;
};

/**
 * The current audio-output device state. Returned by
 * `callManager.audioDevices.getStatus()` and the `useAudioDeviceStatus()` hook.
 */
export type AudioDevicesState = {
  /** All currently available output devices. */
  devices: AudioDevice[];
  /** The id of the active device, matching one of `devices[].id` (when known). */
  selectedDeviceId?: string;
  /** The endpoint type of the active device. */
  currentEndpointType: AudioDeviceEndpointType;
};

export type AudioRole = 'communicator' | 'listener';
export type DeviceEndpointType = 'speaker' | 'earpiece';

export type IOSAudioInterruptionEvent = {
  source: 'callmanager' | 'callingx';
  phase: 'began' | 'ended';
  reason?: 'default' | 'builtInMicMuted' | 'routeDisconnected' | (string & {});
  shouldResume?: boolean;
};

/**
 * Snapshot of the iOS shared `AVAudioSession`.
 */
export type IOSAudioSessionState = {
  category: string;
  mode: string;
  categoryOptions: number;
  isActive: boolean;
  isOtherAudioPlaying: boolean;
  callingxOwnsSession: boolean;
  inputs: string[];
  outputs: string[];
};

/**
 * Emitted by the iOS in-call manager when it configures or activates the audio
 * session for a (non-CallKit) call, including failures that would otherwise
 * only be visible in the native device logs.
 */
export type IOSAudioSessionDiagnosticEvent = IOSAudioSessionState & {
  event:
    | 'setupError'
    | 'engineEnableApplied'
    | 'engineEnableSkipped'
    | 'engineEnableError'
    | 'startPlayoutError'
    | (string & {});
  error?: string;
};

export type StreamInCallManagerConfig =
  | {
      audioRole: 'communicator';
      deviceEndpointType?: DeviceEndpointType;
    }
  | {
      audioRole: 'listener';
    };
