import { Component, OnInit } from '@angular/core';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { NgxPopperjsPlacements, NgxPopperjsTriggers } from 'ngx-popperjs';
import { Observable } from 'rxjs';
import { ParticipantListService } from '../participant-list.service';

/**
 * The `CallParticipantListComponent` displays the list of participants in the active call with a search input that users can use to search for participants.
 *
 * The component contains the following [content projection](https://angular.io/guide/content-projection#content-projection) slots that you can use to replace parts of the component or extend it:
 * - `[participant-list-header]` which you can use to replace the list header with your own content
 * - `[participant-list-search]` which you can use to replace the default search input
 * - `[participant-list]` which you can use to replace the default participant list
 * - `[participant-list-footer]` which you can use to inject your own content into the list footer
 *
 * If you decide to replace parts of the component or wish to create your own participant list component you can use the [`ParticipantListService`](../core/ParticipantListService.md) to gather the necessary logic and data.
 */
@Component({
  selector: 'stream-call-participant-list',
  templateUrl: './call-participant-list.component.html',
  styles: [],
})
export class CallParticipantListComponent implements OnInit {
  participants$: Observable<StreamVideoParticipant[]>;
  popperTrigger = NgxPopperjsTriggers.hover;
  popperPlacement = NgxPopperjsPlacements.TOP;
  readonly TrackType = SfuModels.TrackType;

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
