export type MediaDeviceInfo = {
  deviceId: string;
  facing?: 'environment' | 'front';
  groupId: string;
  kind: 'videoinput' | 'audioinput';
  label: string;
};

/**
 * Exclude types from documentation site, but we should still add doc comments
 * @internal
 *
 * @category Device Management
 */
export interface MediaDevicesContextAPI {
  currentAudioDevice?: MediaDeviceInfo;
  currentVideoDevice?: MediaDeviceInfo;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
}
