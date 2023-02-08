import { Injectable } from '@angular/core';
import { StreamVideoParticipant } from '@stream-io/video-client';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  Subscription,
  throttleTime,
} from 'rxjs';
import { StreamVideoService } from './video.service';

/**
 * The `ParticipantListService` contains all the necessary logic for the [`CallParticipantListComponent`](../ui-components/CallParticipantListComponent.md). If you want to create your own custom participant list UI you can connect your component with this service that will provide the API.
 *
 * You can override the participant search logic using the [`setParticipantsSubject` method](./#setparticipantsaubject).
 */
@Injectable({
  providedIn: 'root',
})
export class ParticipantListService {
  /**
   * The list of particpants that should be displayed on the UI. It's either the full list of participants or a filtered version based on `searchTermSubject`
   */
  readonly participants$: Observable<StreamVideoParticipant[]>;
  /**
   * A `Subject` containing the current value of the participant search input. If you create a custom participant list component with a search input make sure to forward the input's value by calling `searchTermSubject.next(<value>)`
   */
  readonly searchTermSubject = new BehaviorSubject('');
  /**
   * A `Subject` containing the current state of the participant list, it can be opened or closed, you set a new value by calling `participantListStateSubject.next(<open or close>)`
   */
  readonly participantListStateSubject = new BehaviorSubject<'open' | 'close'>(
    'close',
  );
  private participantsSubject = new BehaviorSubject<StreamVideoParticipant[]>(
    [],
  );
  private particpantSubjectSubscirption: Subscription;

  constructor(private streamVideoService: StreamVideoService) {
    this.particpantSubjectSubscirption = combineLatest([
      this.streamVideoService.participants$,
      this.searchTermSubject.pipe(throttleTime(200)),
    ])
      .pipe(
        map(([allParticipants, searchTerm]) => {
          if (!searchTerm) {
            return allParticipants;
          } else {
            const queryRegExp = new RegExp(searchTerm);
            return allParticipants.filter((participant) => {
              return participant.user?.name.match(queryRegExp);
            });
          }
        }),
      )
      .subscribe(this.participantsSubject);
    this.participants$ = this.participantsSubject.asObservable();
  }

  /**
   * Provide your own participant filtering logic to override the default filtering. Make sure to use an `Observable` that has an initial value so the UI component can be initialized properly.
   * @param observable
   */
  setParticipantsSubject(observable: Observable<StreamVideoParticipant[]>) {
    this.particpantSubjectSubscirption.unsubscribe();
    this.particpantSubjectSubscirption = observable.subscribe(
      this.participantsSubject,
    );
  }
}
