import { Component, OnInit } from '@angular/core';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { Observable } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-stage',
  templateUrl: './stage.component.html',
  styles: [],
})
export class StageComponent implements OnInit {
  participants$: Observable<StreamVideoParticipant[]>;
  localParticipant$: Observable<StreamVideoParticipant | undefined>;

  constructor(private streamVideoService: StreamVideoService) {
    this.participants$ = this.streamVideoService.activeCallRemoteParticipants$;
    this.localParticipant$ =
      this.streamVideoService.activeCallLocalParticipant$;
  }

  ngOnInit(): void {}

  trackByParticipantId(_: number, item: StreamVideoParticipant) {
    return item.user?.name || undefined + item.sessionId;
  }
}
