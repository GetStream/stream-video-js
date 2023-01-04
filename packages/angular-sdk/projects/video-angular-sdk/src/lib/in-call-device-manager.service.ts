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

  /**
   * This method will subscribe to the [`activeCall$` state variable](./StreamVideoService.md/#activecall) and apply the device settings to the current active call
   *
   * The method takes the audio, video and screen share streams and audio output setting from the [`DeviceManagerService`](./DeviceManagerService.md) and forwards them to the active call.
   * If a new call is started, this method will apply the existing device settings to the call.
   *
   * Additionally if the audio stream is stopped, this method will start a "silent" audio stream that won't be published to the call, but will be used to check if the [user is speaking while muted](./DeviceManagerService.md#isspeaking).
   */
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
                if (s === 'off') {
                  let audioDevice: string | undefined;
                  this.deviceManager.audioDevice$
                    .pipe(take(1))
                    .subscribe((d) => (audioDevice = d));
                  this.deviceManager.startAudio(audioDevice, true);
                }
              }
            }),
          );
          this.subscriptions.push(
            this.deviceManager.screenShareState$.subscribe((s) => {
              if (s === 'on') {
                this.deviceManager.screenShareStream$
                  .pipe(take(1))
                  .subscribe((stream) =>
                    call.publishScreenShareStream(stream!),
                  );
              } else {
                call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
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

  /**
   * This method removes the subscription to the [`activeCall$` state variable](./StreamVideoService.md/#activecall).
   */
  stop() {
    this.callSubscription?.unsubscribe();
  }
}
