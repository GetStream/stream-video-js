import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Call } from '@stream-io/video-client';
import { NgxPopperjsTriggers } from 'ngx-popperjs';
import { Subscription } from 'rxjs';
import { StreamVideoService } from '../../video.service';

/**
 * The `ToggleStatisticsComponent` component shows or hides the [call statistics](../CallStatistics.md). If there is no active call, nothing is displayed.
 */
@Component({
  selector: 'stream-toggle-statistics',
  templateUrl: './toggle-statistics.component.html',
  styles: [],
})
export class ToggleStatisticsComponent implements OnInit, OnDestroy {
  call?: Call;
  popperTrigger = NgxPopperjsTriggers.click;
  private subscriptions: Subscription[] = [];

  constructor(private streamVideoService: StreamVideoService) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => this.call === c),
    );
  }

  @HostBinding('style')
  get style() {
    return this.call ? {} : { display: 'none' };
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
