import { Component, OnInit } from '@angular/core';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { Observable } from 'rxjs';
import { ParticipantListService } from '../participant-list.service';

@Component({
  selector: 'stream-call-participant-list',
  templateUrl: './call-participant-list.component.html',
  styles: [],
})
export class CallParticipantListComponent implements OnInit {
  participants$: Observable<StreamVideoParticipant[]>;

  constructor(private participantListService: ParticipantListService) {
    this.participants$ = this.participantListService.participants$;
  }

  ngOnInit(): void {}

  listClosed() {
    this.participantListService.participantListStateSubject.next('close');
  }

  searchCleared() {
    this.participantListService.searchTermSubject.next('');
  }

  searchChanged(value?: string) {
    this.participantListService.searchTermSubject.next(value || '');
  }
}
