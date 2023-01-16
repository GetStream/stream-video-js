import { Component, HostBinding, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StreamVideoService } from '../video.service';

/**
 * The `StageComponent` component decides the participant layout. If there is no ongoing screen share it displays the [`CallParticipantsComponent`](./CallParticipantsComponent.md), otherwise it shows the [`CallParticipantsScreenshareComponent`](./CallParticipantsScreenshareComponent.md).
 */
@Component({
  selector: 'stream-stage',
  templateUrl: './stage.component.html',
  styles: [],
})
export class StageComponent implements OnInit {
  hasOngoingScreenshare$: Observable<boolean>;
  @HostBinding('class') class = 'str-video__stage-angular-host';

  constructor(private streamVideoService: StreamVideoService) {
    this.hasOngoingScreenshare$ =
      this.streamVideoService.hasOngoingScreenShare$;
  }

  ngOnInit(): void {}
}
