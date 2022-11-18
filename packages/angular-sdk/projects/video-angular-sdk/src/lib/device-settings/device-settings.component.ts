import { Component, OnInit } from '@angular/core';
import {
  Call,
  getAudioDevices,
  getAudioStream,
  getVideoDevices,
  getVideoStream,
} from '@stream-io/video-client';
import { Observable, Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';
import { NgxPopperjsTriggers } from 'ngx-popperjs';

@Component({
  selector: 'stream-device-settings',
  templateUrl: './device-settings.component.html',
  styles: [],
})
export class DeviceSettingsComponent implements OnInit {
  currentlyUsedAudioDeviceId?: string;
  currentlyUsedVideoDeviceId?: string;
  audioDevices$: Observable<MediaDeviceInfo[]>;
  videoDevices$: Observable<MediaDeviceInfo[]>;
  popperTrigger = NgxPopperjsTriggers.click;
  private activeCall?: Call;
  private subscriptions: Subscription[] = [];

  constructor(private streamVideoService: StreamVideoService) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(
        (c) => (this.activeCall = c),
      ),
    );
    this.subscriptions.push(
      this.streamVideoService.activeCallLocalParticipant$.subscribe((p) => {
        this.currentlyUsedAudioDeviceId = p?.audioDeviceId;
        this.currentlyUsedVideoDeviceId = p?.videoDeviceId;
      }),
    );
    this.audioDevices$ = getAudioDevices();
    this.videoDevices$ = getVideoDevices();
  }

  ngOnInit(): void {}

  async changeInputDevice(
    kind: Exclude<MediaDeviceKind, 'audiooutput'>,
    event: any,
  ) {
    const deviceId = event.target.value;
    try {
      const mediaStream = await (kind === 'audioinput'
        ? getAudioStream(deviceId)
        : getVideoStream(deviceId));
      this.activeCall?.replaceMediaStream(kind, mediaStream);
    } catch (error) {
      console.error(`Error during device changing`, error);
      throw error;
    }
  }
}
