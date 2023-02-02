import { Component, OnDestroy, OnInit } from '@angular/core';
import { Call } from '@stream-io/video-client';
import { Subscription } from 'rxjs';
import { StreamVideoService } from '../../video.service';

/**
 * The `EndCallComponent` displays a button which can be used to leave the currently active call. If there is no active call, nothing is displayed.
 */
@Component({
  selector: 'stream-end-call',
  templateUrl: './end-call.component.html',
  styles: [],
})
export class EndCallComponent implements OnInit, OnDestroy {
  call?: Call;
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

  endCall() {
    this.call?.leave();
  }
}
