import { Injectable } from '@angular/core';
import {
  Call,
  CallCancelled,
  CallCreated,
  CallRejected,
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
   * All participants of the current call (this includes the current user and other participants as well).
   */
  activeCallAllParticipants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
  /**
   * Remote participants of the current call (this includes every participant expect the logged-in user).
   */
  activeCallRemoteParticipants$: Observable<StreamVideoParticipant[]>;
  /**
   * The local participant of the current call (the logged-in user).
   */
  activeCallLocalParticipant$: Observable<
    StreamVideoLocalParticipant | undefined
  >;
  incomingRingCalls$: Observable<CallCreated[]>;
  /**
   * The `videoClient` lets interact with our API, please refer to the [`StreamVideoClient`](./StreamVideoClient.mdx) for more information.
   */
  videoClient: StreamVideoClient | undefined;
  hangupNotifications$: Observable<(CallRejected | CallCancelled)[]>;
  /**
   * Emits a `boolean` indicating whether a call recording is currently in progress.
   */
  callRecordingInProgress$: Observable<boolean>;
  /**
   * Periodically emits statistics about the active call
   */
  callStatsReport$: Observable<CallStatsReport | undefined>;

  private userSubject: ReplaySubject<UserInput | undefined> = new ReplaySubject(
    1,
  );
  private activeCallSubject: ReplaySubject<Call | undefined> =
    new ReplaySubject(1);
  private hangupNotificationsSubject: ReplaySubject<
    (CallRejected | CallCancelled)[]
  > = new ReplaySubject(1);
  private incomingRingCallsSubject: ReplaySubject<CallCreated[]> =
    new ReplaySubject(1);
  private activeCallAllParticipantsSubject: ReplaySubject<
    StreamVideoParticipant[]
  > = new ReplaySubject(1);
  private activeCallRemoteParticipantsSubject: ReplaySubject<
    StreamVideoParticipant[]
  > = new ReplaySubject(1);
  private activeCallLocalParticipantSubject: ReplaySubject<
    StreamVideoParticipant | undefined
  > = new ReplaySubject(1);
  private callRecordingInProgressSubject: ReplaySubject<boolean> =
    new ReplaySubject(1);
  private callStatsReportSubject: ReplaySubject<CallStatsReport | undefined> =
    new ReplaySubject(1);
  private subscriptions: Subscription[] = [];

  /**
   * You don't need to create a `StreamVideoService` instance directly, it will be available for you by importing the `StreamVideoModule` Angular module.
   */
  constructor() {
    this.user$ = this.userSubject.asObservable();
    this.activeCall$ = this.activeCallSubject.asObservable();
    this.incomingRingCalls$ = this.incomingRingCallsSubject.asObservable();
    this.activeCallAllParticipants$ =
      this.activeCallAllParticipantsSubject.asObservable();
    this.activeCallRemoteParticipants$ =
      this.activeCallRemoteParticipantsSubject.asObservable();
    this.activeCallLocalParticipant$ =
      this.activeCallLocalParticipantSubject.asObservable();
    this.hangupNotifications$ = this.hangupNotificationsSubject.asObservable();
    this.callRecordingInProgress$ =
      this.callRecordingInProgressSubject.asObservable();
    this.callStatsReport$ = this.callStatsReportSubject.asObservable();
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
      this.videoClient.readOnlyStateStore?.hangupNotifications$.subscribe(
        this.hangupNotificationsSubject,
      ),
    );

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
      this.videoClient.readOnlyStateStore?.incomingCalls$.subscribe(
        this.incomingRingCallsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.participants$.subscribe(
        this.activeCallAllParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.remoteParticipants$.subscribe(
        this.activeCallRemoteParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.localParticipant$.subscribe(
        this.activeCallLocalParticipantSubject,
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

    return this.videoClient;
  }
}
