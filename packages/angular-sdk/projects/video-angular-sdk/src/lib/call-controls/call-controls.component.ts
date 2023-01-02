import { Component, OnDestroy, OnInit } from '@angular/core';
import { Call, SfuModels, CallMeta } from '@stream-io/video-client';
import { NgxPopperjsTriggers } from 'ngx-popperjs';
import { Subscription } from 'rxjs';
import {
  DeviceManagerService,
  MediaStreamState,
  ScreenShareState,
} from '../device-manager.service';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call-controls',
  templateUrl: './call-controls.component.html',
  styles: [],
})
export class CallControlsComponent implements OnInit, OnDestroy {
  videoState?: MediaStreamState;
  audioState?: MediaStreamState;
  screenShareState?: ScreenShareState;
  call?: Call;
  isCallRecordingInProgress: boolean = false;
  popperTrigger = NgxPopperjsTriggers.click;
  private subscriptions: Subscription[] = [];
  private activeCallMeta!: CallMeta.Call;

  TrackType = SfuModels.TrackType;

  constructor(
    private streamVideoService: StreamVideoService,
    private deviceManager: DeviceManagerService,
  ) {
    this.subscriptions.push(
      this.streamVideoService.callRecordingInProgress$.subscribe(
        (inProgress) => (this.isCallRecordingInProgress = inProgress),
      ),
    );
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => (this.call = c)),
    );
    this.subscriptions.push(
      this.streamVideoService.acceptedCall$.subscribe((acceptedCall) => {
        if (acceptedCall && acceptedCall.call) {
          this.activeCallMeta = acceptedCall.call;
        }
      }),
    );
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
  }

  ngOnInit(): void {}

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

  toggleRecording() {
    this.isCallRecordingInProgress
      ? this.streamVideoService.videoClient?.stopRecording(
          this.activeCallMeta.id,
          this.activeCallMeta.type,
        )
      : this.streamVideoService.videoClient?.startRecording(
          this.activeCallMeta.id,
          this.activeCallMeta.type,
        );
  }

  endCall() {
    this.call?.leave();
  }
}
