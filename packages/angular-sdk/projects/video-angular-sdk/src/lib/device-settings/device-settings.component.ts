import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { NgxPopperjsTriggers } from 'ngx-popperjs';
import { DeviceManagerService } from '../device-manager.service';

/**
 * The `DeviceSettingsComponent` can be used to select video, audio and audio output (if the current browser supports it) device.
 *
 * Selector: `stream-device-settings`
 */
@Component({
  selector: 'stream-device-settings',
  templateUrl: './device-settings.component.html',
  styles: [],
})
export class DeviceSettingsComponent implements OnInit, OnDestroy {
  currentlyUsedAudioDeviceId?: string;
  currentlyUsedVideoDeviceId?: string;
  currentlyUsedAudioOutputDeviceId?: string;
  audioDevices$: Observable<MediaDeviceInfo[]>;
  videoDevices$: Observable<MediaDeviceInfo[]>;
  audioOutputDevices$: Observable<MediaDeviceInfo[]>;
  popperTrigger = NgxPopperjsTriggers.click;
  isAudioOuputDeviceChangeSupported =
    this.deviceManager.isAudioOutputChangeSupportedByBrowser;
  private subscriptions: Subscription[] = [];

  constructor(private deviceManager: DeviceManagerService) {
    this.audioDevices$ = this.deviceManager.audioDevices$;
    this.videoDevices$ = this.deviceManager.videoDevices$;
    this.audioOutputDevices$ = this.deviceManager.audioOutputDevices$;
    this.subscriptions.push(
      this.deviceManager.audioDevice$.subscribe(
        (d) => (this.currentlyUsedAudioDeviceId = d),
      ),
    );
    this.subscriptions.push(
      this.deviceManager.videoDevice$.subscribe(
        (d) => (this.currentlyUsedVideoDeviceId = d),
      ),
    );
    this.subscriptions.push(
      this.deviceManager.audioOutputDevice$.subscribe(
        (d) => (this.currentlyUsedAudioOutputDeviceId = d),
      ),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  selectAudioDevice(event: any) {
    this.deviceManager.startAudio(event.target.value);
  }

  selectVideoDevice(event: any) {
    this.deviceManager.startVideo(event.target.value);
  }

  selectAudioOutputDevice(event: any) {
    this.deviceManager.selectAudioOutput(event.target.value);
  }
}
