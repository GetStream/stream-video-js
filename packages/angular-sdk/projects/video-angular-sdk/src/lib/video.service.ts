import { Injectable, NgZone } from '@angular/core';
import {
  Call,
  CallStatsReport,
  CallMetadata,
  StreamVideoClient,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  User,
  CallAccepted,
} from '@stream-io/video-client';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

/**
 * The `StreamVideoService` is an Angular service that is responsible for the followings:
 * 1. it lets you create a [StreamVideoClient](StreamVideoClient.md) instance to interact with our API
 * 2. you can subscribe to state changes using the [`RxJS Observables`](https://rxjs.dev/guide/observable) defined in this class. Our library is built in a way that all state changes are exposed in this store, so all UI changes in your application should be handled by subscribing to these variables.
 */
@Injectable({
  providedIn: 'root',
})
export class StreamVideoService {
  /**
   * The currently connected user.
   */
  user$: Observable<User | undefined>;
  /**
   * The call controller instance representing the call the user attends.
   * The controller instance exposes call metadata as well.
   * `activeCall$` will be set after calling [`join` on a `Call` instance](./Call.md/#join) and cleared after calling [`leave`](./Call.md/#leave).
   */
  activeCall$: Observable<Call | undefined>;
  /**
   * A list of objects describing all created calls that have not been yet accepted, rejected nor cancelled.
   */
  pendingCalls$: Observable<CallMetadata[]>;
  /**
   * A list of objects describing calls initiated by the current user (connectedUser).
   */
  outgoingCalls$: Observable<CallMetadata[]>;
  /**
   * A list of objects describing incoming calls.
   */
  incomingCalls$: Observable<CallMetadata[]>;
  /**
   * The call data describing an incoming call accepted by a participant.
   * Serves as a flag decide, whether an incoming call should be joined.
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
  /**
   * The `videoClient` lets interact with our API, please refer to the [`StreamVideoClient`](./StreamVideoClient.mdx) for more information.
   */
  videoClient: StreamVideoClient | undefined;
  /**
   * Emits a `boolean` indicating whether a call recording is currently in progress.
   */
  callRecordingInProgress$: Observable<boolean>;
  /**
   * The latest stats report of the current call.
   * When stats gathering is enabled, this observable will emit a new value
   * at a regular (configurable) interval.
   *
   * Consumers of this observable can implement their own batching logic
   * in case they want to show historical stats data.
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

  private userSubject: ReplaySubject<User | undefined> = new ReplaySubject(1);
  private activeCallSubject: ReplaySubject<Call | undefined> =
    new ReplaySubject(1);

  private acceptedCallSubject: ReplaySubject<CallAccepted | undefined> =
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
  private pendingCallsSubject: ReplaySubject<CallMetadata[]> =
    new ReplaySubject(1);
  private outgoingCallsSubject: ReplaySubject<CallMetadata[]> =
    new ReplaySubject(1);
  private incomingCallsSubject: ReplaySubject<CallMetadata[]> =
    new ReplaySubject(1);
  private subscriptions: Subscription[] = [];

  /**
   * You don't need to create a `StreamVideoService` instance directly, it will be available for you by importing the `StreamVideoModule` Angular module.
   */
  constructor(private ngZone: NgZone) {
    this.user$ = this.userSubject.asObservable();
    this.activeCall$ = this.activeCallSubject.asObservable();
    this.acceptedCall$ = this.acceptedCallSubject.asObservable();
    this.participants$ = this.allParticipantsSubject.asObservable();
    this.remoteParticipants$ = this.remoteParticipantsSubject.asObservable();
    this.localParticipant$ = this.localParticipantSubject.asObservable();
    this.callRecordingInProgress$ =
      this.callRecordingInProgressSubject.asObservable();
    this.callStatsReport$ = this.callStatsReportSubject.asObservable();
    this.hasOngoingScreenShare$ =
      this.hasOngoingScreenShareSubject.asObservable();
    this.incomingCalls$ = this.incomingCallsSubject.asObservable();
    this.outgoingCalls$ = this.outgoingCallsSubject.asObservable();
    this.pendingCalls$ = this.pendingCallsSubject.asObservable();
  }

  init(apiKey: string) {
    if (this.videoClient) {
      console.warn(
        `Multiple init calls detected, this is usually unnecessary, make sure you know what you're doing`,
      );
      this.videoClient.disconnectUser().catch((e) => {
        console.error(`Failed to disconnect user`, e);
      });
      this.subscriptions.forEach((s) => s.unsubscribe());
    }

    this.videoClient = new StreamVideoClient(apiKey);

    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.connectedUser$.subscribe({
        next: (v) => this.ngZone.run(() => this.userSubject.next(v)),
        error: (e) => this.ngZone.run(() => this.userSubject.error(e)),
        complete: () => this.ngZone.run(() => this.userSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCall$.subscribe({
        next: (v) => this.ngZone.run(() => this.activeCallSubject.next(v)),
        error: (e) => this.ngZone.run(() => this.activeCallSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.activeCallSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore.acceptedCall$.subscribe({
        next: (v) => this.ngZone.run(() => this.acceptedCallSubject.next(v)),
        error: (e) => this.ngZone.run(() => this.acceptedCallSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.acceptedCallSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.participants$.subscribe({
        next: (v) => this.ngZone.run(() => this.allParticipantsSubject.next(v)),
        error: (e) =>
          this.ngZone.run(() => this.allParticipantsSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.allParticipantsSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.remoteParticipants$.subscribe({
        next: (v) =>
          this.ngZone.run(() => this.remoteParticipantsSubject.next(v)),
        error: (e) =>
          this.ngZone.run(() => this.remoteParticipantsSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.remoteParticipantsSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.localParticipant$.subscribe({
        next: (v) =>
          this.ngZone.run(() => this.localParticipantSubject.next(v)),
        error: (e) =>
          this.ngZone.run(() => this.localParticipantSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.localParticipantSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.callRecordingInProgress$.subscribe({
        next: (v) =>
          this.ngZone.run(() => this.callRecordingInProgressSubject.next(v)),
        error: (e) =>
          this.ngZone.run(() => this.callRecordingInProgressSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.callRecordingInProgressSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.callStatsReport$.subscribe({
        next: (v) => this.ngZone.run(() => this.callStatsReportSubject.next(v)),
        error: (e) =>
          this.ngZone.run(() => this.callStatsReportSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.callStatsReportSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.hasOngoingScreenShare$.subscribe({
        next: (v) =>
          this.ngZone.run(() => this.hasOngoingScreenShareSubject.next(v)),
        error: (e) =>
          this.ngZone.run(() => this.hasOngoingScreenShareSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.hasOngoingScreenShareSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.incomingCalls$.subscribe({
        next: (v) => this.ngZone.run(() => this.incomingCallsSubject.next(v)),
        error: (e) => this.ngZone.run(() => this.incomingCallsSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.incomingCallsSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.outgoingCalls$.subscribe({
        next: (v) => this.ngZone.run(() => this.outgoingCallsSubject.next(v)),
        error: (e) => this.ngZone.run(() => this.outgoingCallsSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.outgoingCallsSubject.complete()),
      }),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.pendingCalls$.subscribe({
        next: (v) => this.ngZone.run(() => this.pendingCallsSubject.next(v)),
        error: (e) => this.ngZone.run(() => this.pendingCallsSubject.error(e)),
        complete: () =>
          this.ngZone.run(() => this.pendingCallsSubject.complete()),
      }),
    );

    return this.videoClient;
  }

  /** Generates the invite link for the given call ID and wrties it to the clipboard. */
  copyInviteLink(callId: string) {
    return navigator?.clipboard.writeText(this.getInviteLink(callId));
  }

  /**
   * Returns the invite link for the given call metadata, you can redefine this method if your application needs a different link format.
   * @param callId
   */
  getInviteLink = (callId: string) => {
    return `${window.location.host}?callid=${callId}`;
  };
}
