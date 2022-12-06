import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, tap } from 'rxjs';
import {
  DeviceManagerService,
  MediaStreamState,
} from '../device-manager.service';

@Component({
  selector: 'app-device-control',
  templateUrl: './device-control.component.html',
  styleUrls: ['./device-control.component.scss'],
})
export class DeviceControlComponent implements OnInit, OnDestroy {
  videoState?: MediaStreamState;
  audioState?: MediaStreamState;
  audioDevices$: Observable<MediaDeviceInfo[]>;
  videoDevices$: Observable<MediaDeviceInfo[]>;
  audioOutputDevices$: Observable<MediaDeviceInfo[]>;
  videoDevice$: Observable<string | undefined>;
  audioDevice$: Observable<string | undefined>;
  audioOutputDevice$: Observable<string | undefined>;
  private subscriptions: Subscription[] = [];

  constructor(private deviceManager: DeviceManagerService) {
    this.subscriptions.push(
      this.deviceManager.videoState$.subscribe((s) => (this.videoState = s)),
    );
    this.subscriptions.push(
      this.deviceManager.audioState$.subscribe((s) => (this.audioState = s)),
    );
    this.audioDevices$ = this.deviceManager.audioDevices$;
    this.videoDevices$ = this.deviceManager.videoDevices$;
    this.audioOutputDevices$ = this.deviceManager.audioOutputDevices$;
    this.videoDevice$ = this.deviceManager.videoDevice$.pipe(tap(console.log));
    this.audioDevice$ = this.deviceManager.audioDevice$;
    this.audioOutputDevice$ = this.deviceManager.audioOutputDevice$;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleAudio() {
    this.deviceManager.toggleAudio();
  }

  toggleVideo() {
    this.deviceManager.toggleVideo();
  }

  selectAudioDevice(deviceId: string) {
    this.deviceManager.startAudio(deviceId);
  }

  selectVideoDevice(deviceId: string) {
    this.deviceManager.startVideo(deviceId);
  }

  selectAudioOutputDevice(deviceId: string) {
    this.deviceManager.selectAudioOutput(deviceId);
  }

  ngOnInit(): void {}
}
