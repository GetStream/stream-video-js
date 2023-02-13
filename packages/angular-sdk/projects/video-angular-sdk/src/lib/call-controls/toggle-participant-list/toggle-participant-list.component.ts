import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Call } from '@stream-io/video-client';
import { Subscription } from 'rxjs';
import { ParticipantListService } from '../../participant-list.service';
import { StreamVideoService } from '../../video.service';

/**
 * The `ToggleParticipantListComponent` displays a button that can be used to toggle the state of the [`participantListStateSubject`](../core/ParticipantListService.md/#participantliststatesubject).
 *
 * If there is no active call the component displays nothing.
 */
@Component({
  selector: 'stream-toggle-participant-list',
  templateUrl: './toggle-participant-list.component.html',
  styles: [],
})
export class ToggleParticipantListComponent implements OnInit, OnDestroy {
  call?: Call;
  currentState: 'open' | 'close' = 'close';
  private subscriptions: Subscription[] = [];

  constructor(
    private participantListService: ParticipantListService,
    private streamVideoService: StreamVideoService,
  ) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => (this.call = c)),
    );
    this.subscriptions.push(
      this.participantListService.participantListStateSubject.subscribe(
        (s) => (this.currentState = s),
      ),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleParticipantList() {
    this.participantListService.participantListStateSubject.next(
      this.currentState === 'open' ? 'close' : 'open',
    );
  }

  @HostBinding('style')
  get style() {
    return this.call ? {} : { display: 'none' };
  }
}
