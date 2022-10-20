import { Injectable } from '@angular/core';
import { Call, StreamVideoClient, UserInput } from '@stream-io/video-client';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreamVideoService {
  user$: Observable<UserInput | undefined>;
  activeCall$: Observable<Call | undefined>;
  videoClient: StreamVideoClient | undefined;
  private userSubject: ReplaySubject<UserInput | undefined> = new ReplaySubject(
    1,
  );
  private activeCallSubject: ReplaySubject<Call | undefined> =
    new ReplaySubject(1);
  private subscriptions: Subscription[] = [];

  constructor() {
    this.user$ = this.userSubject.asObservable();
    this.activeCall$ = this.activeCallSubject.asObservable();
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

    return this.videoClient;
  }
}
