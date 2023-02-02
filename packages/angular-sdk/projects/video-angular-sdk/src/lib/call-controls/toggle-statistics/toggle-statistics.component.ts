import { Component, OnInit } from '@angular/core';
import { Call } from '@stream-io/video-client';
import { NgxPopperjsTriggers } from 'ngx-popperjs';
import { Observable } from 'rxjs';
import { StreamVideoService } from '../../video.service';

/**
 * The `ToggleStatisticsComponent` component shows or hides the [call statistics](../CallStatistics.md). If there is no active call, nothing is displayed.
 */
@Component({
  selector: 'stream-toggle-statistics',
  templateUrl: './toggle-statistics.component.html',
  styles: [],
})
export class ToggleStatisticsComponent implements OnInit {
  popperTrigger = NgxPopperjsTriggers.click;
  call$: Observable<Call | undefined>;

  constructor(private streamVideoService: StreamVideoService) {
    this.call$ = this.streamVideoService.activeCall$;
  }

  ngOnInit(): void {}
}
