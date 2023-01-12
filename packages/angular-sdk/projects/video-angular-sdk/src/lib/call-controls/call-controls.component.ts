import { Component, OnDestroy, OnInit } from '@angular/core';
import { Call, SfuModels } from '@stream-io/video-client';
import { NgxPopperjsTriggers } from 'ngx-popperjs';
import { combineLatest, Subscription } from 'rxjs';
import { DeviceManagerService } from '../device-manager.service';
import {
  AudioMediaStreamState,
  MediaStreamState,
  ScreenShareState,
} from '../types';
import { StreamVideoService } from '../video.service';

/**
 * The `CallControlsComponent` displays call and device management (start/stop recording, hangup, mute audio etc.) related actions.
 *
 * The component can be used if the user is in a call or even if not in a call (however some actions aren't visible in that case).
 *
 * Selector: `stream-call-controls`
 */
@Component({
  selector: 'stream-call-controls',
  templateUrl: './call-controls.component.html',
  styles: [],
})
export class CallControlsComponent implements OnInit, OnDestroy {
  videoState?: MediaStreamState;
  audioState?: AudioMediaStreamState;
  screenShareState?: ScreenShareState;
  call?: Call;
  isCallRecordingInProgress: boolean = false;
  isSpeakingWhileMuted = false;
  popperTrigger = NgxPopperjsTriggers.click;
  private subscriptions: Subscription[] = [];

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
    this.subscriptions.push(
      combineLatest([
        this.deviceManager.audioState$,
        this.deviceManager.isSpeaking$,
      ]).subscribe(([audioState, isSpeaking]) => {
        this.isSpeakingWhileMuted =
          audioState === 'detecting-speech-while-muted' && isSpeaking;
      }),
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
          this.call!.data.call!.id,
          this.call!.data.call!.type,
        )
      : this.streamVideoService.videoClient?.startRecording(
          this.call!.data.call!.id,
          this.call!.data.call!.type,
        );
  }

  endCall() {
    this.call?.leave();
  }
}
