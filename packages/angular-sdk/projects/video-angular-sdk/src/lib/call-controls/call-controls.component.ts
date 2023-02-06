import { Component, OnDestroy, OnInit } from '@angular/core';
import { SfuModels } from '@stream-io/video-client';
import { combineLatest, Subscription } from 'rxjs';
import { DeviceManagerService } from '../device-manager.service';

/**
 * The `CallControlsComponent` displays call and device management (start/stop recording, hangup, mute audio etc.) related actions.
 *
 * The component can be used if the user is in a call or even if not in a call (however some actions aren't visible in that case).
 *
 * Each call control button is available as a separate UI component which make it easy to create your own call controls component using the individual call control button built-in components.
 *
 * The component contains the following [content projection](https://angular.io/guide/content-projection#content-projection) slots:
 * - `[call-controls-start]` which you can use to inject your own content before the first call controls section
 * - `[call-controls-start-start]` which you can use to inject your own content to the beginning of the first section
 * - `[call-controls-start-end]` which you can use to inject your own content to the end of the first section
 * - `[call-controls-middle-start]` which you can use to inject your own content to the beginning of the middle section
 * - `[call-controls-middle-end]` which you can use to inject your own content to the end of the middle section
 * - `[call-controls-end]` which you can use to inject you own content after the last call controls section
 * - `[speaking-while-muted-notification]` which you can use to inject your own notification content to be displayed when someone is speaking while muted
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
