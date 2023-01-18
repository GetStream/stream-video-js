import { Component, OnDestroy, OnInit } from '@angular/core';
import { map, Observable, Subscription } from 'rxjs';
import {
  AudioMediaStreamState,
  DeviceManagerService,
  MediaStreamState,
  ScreenShareState,
  StreamVideoService,
} from '@stream-io/video-angular-sdk';

@Component({
  selector: 'app-device-control',
  templateUrl: './device-control.component.html',
  styleUrls: ['./device-control.component.scss'],
})
export class DeviceControlComponent implements OnInit, OnDestroy {
  videoState?: MediaStreamState;
  audioState?: AudioMediaStreamState;
  screenShareState?: ScreenShareState;
  audioDevices$: Observable<MediaDeviceInfo[]>;
  videoDevices$: Observable<MediaDeviceInfo[]>;
  audioOutputDevices$: Observable<MediaDeviceInfo[]>;
  videoDevice$: Observable<string | undefined>;
  audioDevice$: Observable<string | undefined>;
  audioOutputDevice$: Observable<string | undefined>;
  inCall$: Observable<boolean>;
  private subscriptions: Subscription[] = [];

  constructor(
    private deviceManager: DeviceManagerService,
    private streamVideoService: StreamVideoService,
  ) {
    this.subscriptions.push(
      this.deviceManager.videoState$.subscribe((s) => (this.videoState = s)),
    );
    this.subscriptions.push(
      this.deviceManager.audioState$.subscribe((s) => (this.audioState = s)),
    );
    this.subscriptions.push(
      this.deviceManager.screenShareState$.subscribe(
        (s) => (this.screenShareState = s),
      ),
    );
    this.audioDevices$ = this.deviceManager.audioDevices$;
    this.videoDevices$ = this.deviceManager.videoDevices$;
    this.audioOutputDevices$ = this.deviceManager.audioOutputDevices$;
    this.videoDevice$ = this.deviceManager.videoDevice$;
    this.audioDevice$ = this.deviceManager.audioDevice$;
    this.audioOutputDevice$ = this.deviceManager.audioOutputDevice$;
    this.inCall$ = this.streamVideoService.activeCall$.pipe(map((c) => !!c));
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

  toggleScreenShare() {
    this.deviceManager.toggleScreenShare();
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
