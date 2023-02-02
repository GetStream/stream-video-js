import { Component, OnDestroy, OnInit } from '@angular/core';
import { SfuModels } from '@stream-io/video-client';
import { combineLatest, Subscription } from 'rxjs';
import { DeviceManagerService } from '../device-manager.service';

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
  isSpeakingWhileMuted = false;
  private subscriptions: Subscription[] = [];

  TrackType = SfuModels.TrackType;

  constructor(private deviceManager: DeviceManagerService) {
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
}
