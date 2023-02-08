import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Call } from '@stream-io/video-client';
import { Subscription } from 'rxjs';
import { ParticipantListService } from '../../participant-list.service';
import { StreamVideoService } from '../../video.service';

@Component({
  selector: 'stream-toggle-participant-list',
  templateUrl: './toggle-participant-list.component.html',
  styles: [],
})
export class ToggleParticipantListComponent implements OnInit, OnDestroy {
  call?: Call;
  private subscriptions: Subscription[] = [];

  constructor(
    private participantListService: ParticipantListService,
    private streamVideoService: StreamVideoService,
  ) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => (this.call = c)),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleParticipantList() {
    const currentState =
      this.participantListService.participantListStateSubject.getValue();
    this.participantListService.participantListStateSubject.next(
      currentState === 'open' ? 'close' : 'open',
    );
  }

  @HostBinding('style')
  get style() {
    return this.call ? {} : { display: 'none' };
  }
}
