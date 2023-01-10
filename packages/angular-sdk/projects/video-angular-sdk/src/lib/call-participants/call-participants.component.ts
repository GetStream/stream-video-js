import { Component, OnInit } from '@angular/core';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { Observable } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call-participants',
  templateUrl: './call-participants.component.html',
  styles: [],
})
export class CallParticipantsComponent implements OnInit {
  participants$: Observable<StreamVideoParticipant[]>;
  localParticipant$: Observable<StreamVideoParticipant | undefined>;

  constructor(private streamVideoService: StreamVideoService) {
    this.participants$ = this.streamVideoService.remoteParticipants$;
    this.localParticipant$ = this.streamVideoService.localParticipant$;
  }

  ngOnInit(): void {}

  trackByParticipantId(_: number, item: StreamVideoParticipant) {
    return item.userId || undefined + item.sessionId;
  }
}
