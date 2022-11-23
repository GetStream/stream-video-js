import { Injectable } from '@angular/core';
import {
  Call,
  StreamVideoClient,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  UserInput,
  CallMeta,
} from '@stream-io/video-client';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

/**
 * The `StreamVideoService` has two important tasks: 1. it lets you create a [StreamVideoClient](StreamVideoClient.md) instance to interact with our API, 2. you can subscribe to state changes using the [`RxJS Observables`](https://rxjs.dev/guide/observable) defined on this class
 */
@Injectable({
  providedIn: 'root',
})
export class StreamVideoService {
  /**
   * The currently connected user
   */
  user$: Observable<UserInput | undefined>;
  /**
   * The call the current user participantes in
   */
  activeCall$: Observable<Call | undefined>;
  incomingRingCalls$: Observable<CallMeta.Call[]>;
  /**
   * All participants of the current call (this includes the current user and other participants as well)
   */
  activeCallAllParticipants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
  /**
   * Remote participants of the current call (this includes every participant expect the logged in user)
   */
  activeCallRemoteParticipants$: Observable<StreamVideoParticipant[]>;
  /**
   * The local participant of the current call (the logged in user)
   */
  activeCallLocalParticipant$: Observable<
    StreamVideoLocalParticipant | undefined
  >;
  /**
   * The `videoClient` lets interact with our API, please refer to the [`StreamVideoClient`](./StreamVideoClient.mdx) for more information
   */
  videoClient: StreamVideoClient | undefined;
  activeRingCallMeta$: Observable<CallMeta.Call | undefined>;
  activeRingCallDetails$: Observable<CallMeta.CallDetails | undefined>;
  terminatedRingCallMeta$: Observable<CallMeta.Call | undefined>;

  private userSubject: ReplaySubject<UserInput | undefined> = new ReplaySubject(
    1,
  );
  private activeCallSubject: ReplaySubject<Call | undefined> =
    new ReplaySubject(1);
  private activeRingCallMetaSubject: ReplaySubject<CallMeta.Call | undefined> =
    new ReplaySubject(1);
  private activeRingCallDetailsSubject: ReplaySubject<
    CallMeta.CallDetails | undefined
  > = new ReplaySubject(1);
  private terminatedRingCallMetaSubject: ReplaySubject<
    CallMeta.Call | undefined
  > = new ReplaySubject(1);
  private incomingRingCallsSubject: ReplaySubject<CallMeta.Call[]> =
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
  private subscriptions: Subscription[] = [];

  /**
   * You don't need create a `StreamVideoService` instance directly, it will be available for you by importing the `StreamVideoModule` Angular module
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
    this.activeRingCallMeta$ = this.activeRingCallMetaSubject.asObservable();
    this.activeRingCallDetails$ =
      this.activeRingCallDetailsSubject.asObservable();
    this.terminatedRingCallMeta$ =
      this.terminatedRingCallMetaSubject.asObservable();
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
      this.videoClient.readOnlyStateStore?.activeRingCallMeta$.subscribe(
        this.activeRingCallMetaSubject,
      ),
    );

    this.subscriptions.push(
      this.videoClient.readOnlyStateStore.activeRingCallDetails$.subscribe(
        this.activeRingCallDetailsSubject,
      ),
    );

    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.terminatedRingCallMeta$.subscribe(
        this.terminatedRingCallMetaSubject,
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
      this.videoClient.readOnlyStateStore?.incomingRingCalls$.subscribe(
        this.incomingRingCallsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCallAllParticipants$.subscribe(
        this.activeCallAllParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCallRemoteParticipants$.subscribe(
        this.activeCallRemoteParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCallLocalParticipant$.subscribe(
        this.activeCallLocalParticipantSubject,
      ),
    );

    return this.videoClient;
  }
}
