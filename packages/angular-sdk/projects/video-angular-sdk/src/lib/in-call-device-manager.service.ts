import { Injectable } from '@angular/core';
import { SfuModels } from '@stream-io/video-client';
import { Subscription, take } from 'rxjs';
import { DeviceManagerService } from './device-manager.service';
import { StreamVideoService } from './video.service';

/**
 * This service can be used to apply changes coming from the [`DeviceManagerService`](./DeviceManagerService.md) to the [active call](Call.md)
 * For example: if a user turns off video using the `DeviceManagerService` this class will instruct the active call to stop publishing video
 */
@Injectable({
  providedIn: 'root',
})
export class InCallDeviceManagerService {
  private callSubscription?: Subscription;
  private subscriptions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private deviceManager: DeviceManagerService,
  ) {}

  start() {
    this.callSubscription = this.streamVideoService.activeCall$.subscribe(
      (call) => {
        if (call) {
          this.subscriptions.push(
            this.deviceManager.videoState$.subscribe((s) => {
              if (s === 'on') {
                this.deviceManager.videoStream$
                  .pipe(take(1))
                  .subscribe((stream) => call.publishVideoStream(stream!));
              } else {
                call.stopPublish(SfuModels.TrackType.VIDEO);
              }
            }),
          );
          this.subscriptions.push(
            this.deviceManager.audioState$.subscribe((s) => {
              if (s === 'on') {
                this.deviceManager.audioStream$
                  .pipe(take(1))
                  .subscribe((stream) => call.publishAudioStream(stream!));
              } else {
                call.stopPublish(SfuModels.TrackType.AUDIO);
              }
            }),
          );
          this.subscriptions.push(
            this.deviceManager.audioOutputDevice$.subscribe((d) => {
              call.setAudioOutputDevice(d);
            }),
          );
        } else {
          this.subscriptions.forEach((s) => s.unsubscribe());
        }
      },
    );
  }

  stop() {
    this.callSubscription?.unsubscribe();
  }
}
