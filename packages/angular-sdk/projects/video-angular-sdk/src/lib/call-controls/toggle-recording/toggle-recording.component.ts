import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Call } from '@stream-io/video-client';
import { StreamVideoService } from '../../video.service';

/**
 * The `ToggleRecordingComponent` displays a button which can be used to start or stop recording the currently active call. If there is no active call, nothing is displayed.
 */
@Component({
  selector: 'stream-toggle-recording',
  templateUrl: './toggle-recording.component.html',
  styles: [],
})
export class ToggleRecordingComponent implements OnInit, OnDestroy {
  call?: Call;
  isCallRecordingInProgress: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private streamVideoService: StreamVideoService) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => (this.call = c)),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
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
}
