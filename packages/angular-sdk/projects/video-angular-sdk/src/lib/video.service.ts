import { Injectable } from '@angular/core';
import {
  Call,
  CallAccepted,
  CallCreated,
  CallStatsReport,
  StreamVideoClient,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  UserInput,
} from '@stream-io/video-client';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

/**
 * The `StreamVideoService` is an Angular service that is responsible for the followings:
 * 1. it lets you create a [StreamVideoClient](StreamVideoClient.md) instance to interact with our API
 * 2. you can subscribe to state changes using the [`RxJS Observables`](https://rxjs.dev/guide/observable) defined on this class.
 */
@Injectable({
  providedIn: 'root',
})
export class StreamVideoService {
  /**
   * The currently connected user.
   */
  user$: Observable<UserInput | undefined>;
  /**
   * The call the current user participates in.
   */
  activeCall$: Observable<Call | undefined>;
  /**
   * The accepted call metadata.
   */
  acceptedCall$: Observable<CallAccepted | undefined>;
  /**
   * All participants of the current call (this includes the current user and other participants as well).
   */
  participants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
  /**
   * Remote participants of the current call (this includes every participant expect the logged-in user).
   */
  remoteParticipants$: Observable<StreamVideoParticipant[]>;
  /**
   * The local participant of the current call (the logged-in user).
   */
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  incomingRingCalls$: Observable<CallCreated[]>;
  /**
   * The `videoClient` lets interact with our API, please refer to the [`StreamVideoClient`](./StreamVideoClient.mdx) for more information.
   */
  videoClient: StreamVideoClient | undefined;
  /**
   * Emits a `boolean` indicating whether a call recording is currently in progress.
   */
  callRecordingInProgress$: Observable<boolean>;
  /**
   * Periodically emits statistics about the active call
   */
  callStatsReport$: Observable<CallStatsReport | undefined>;
  /**
   * Emits true whenever there is an active screen sharing session within
   * the current call. Useful for displaying a "screen sharing" indicator and
   * switching the layout to a screen sharing layout.
   *
   * The actual screen sharing track isn't exposed here, but can be retrieved
   * from the list of call participants. We also don't want to be limiting
   * to the number of share screen tracks are displayed in a call.
   */
  hasOngoingScreenShare$: Observable<boolean>;

  private userSubject: ReplaySubject<UserInput | undefined> = new ReplaySubject(
    1,
  );
  private activeCallSubject: ReplaySubject<Call | undefined> =
    new ReplaySubject(1);

  private acceptedCallSubject: ReplaySubject<CallAccepted | undefined> =
    new ReplaySubject(1);
  private incomingRingCallsSubject: ReplaySubject<CallCreated[]> =
    new ReplaySubject(1);
  private allParticipantsSubject: ReplaySubject<StreamVideoParticipant[]> =
    new ReplaySubject(1);
  private remoteParticipantsSubject: ReplaySubject<StreamVideoParticipant[]> =
    new ReplaySubject(1);
  private localParticipantSubject: ReplaySubject<
    StreamVideoParticipant | undefined
  > = new ReplaySubject(1);
  private callRecordingInProgressSubject: ReplaySubject<boolean> =
    new ReplaySubject(1);
  private callStatsReportSubject: ReplaySubject<CallStatsReport | undefined> =
    new ReplaySubject(1);
  private hasOngoingScreenShareSubject: ReplaySubject<boolean> =
    new ReplaySubject(1);
  private subscriptions: Subscription[] = [];

  /**
   * You don't need to create a `StreamVideoService` instance directly, it will be available for you by importing the `StreamVideoModule` Angular module.
   */
  constructor() {
    this.user$ = this.userSubject.asObservable();
    this.activeCall$ = this.activeCallSubject.asObservable();
    this.acceptedCall$ = this.acceptedCallSubject.asObservable();
    this.incomingRingCalls$ = this.incomingRingCallsSubject.asObservable();
    this.participants$ = this.allParticipantsSubject.asObservable();
    this.remoteParticipants$ = this.remoteParticipantsSubject.asObservable();
    this.localParticipant$ = this.localParticipantSubject.asObservable();
    this.callRecordingInProgress$ =
      this.callRecordingInProgressSubject.asObservable();
    this.callStatsReport$ = this.callStatsReportSubject.asObservable();
    this.hasOngoingScreenShare$ =
      this.hasOngoingScreenShareSubject.asObservable();
  }

  init(
    apiKey: string,
    token: string,
    baseCoordinatorUrl: string,
    baseWsUrl: string,
  ) {
    if (this.videoClient) {
      console.warn(
        `Multiple init calls detected, this is usually unnecessary, make sure you know what you're doing`,
      );
      this.videoClient.disconnect();
      this.subscriptions.forEach((s) => s.unsubscribe());
    }

    this.videoClient = new StreamVideoClient(apiKey, {
      coordinatorRpcUrl: baseCoordinatorUrl,
      coordinatorWsUrl: baseWsUrl,
      sendJson: true,
      token,
    });

    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.connectedUser$.subscribe(
        this.userSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCall$.subscribe(
        this.activeCallSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore.acceptedCall$.subscribe(
        this.acceptedCallSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.incomingCalls$.subscribe(
        this.incomingRingCallsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.participants$.subscribe(
        this.allParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.remoteParticipants$.subscribe(
        this.remoteParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.localParticipant$.subscribe(
        this.localParticipantSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.callRecordingInProgress$.subscribe(
        this.callRecordingInProgressSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.callStatsReport$.subscribe(
        this.callStatsReportSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.hasOngoingScreenShare$.subscribe(
        this.hasOngoingScreenShareSubject,
      ),
    );

    return this.videoClient;
  }
}
