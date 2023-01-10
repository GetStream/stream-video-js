import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Call } from '@stream-io/video-client';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { Observable, Subscription } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `<div class="container">
    <div>Connected as {{ (user$ | async)?.name }}</div>
    <stream-call *ngIf="activeCall; else noCall"></stream-call>

    <ng-template #noCall> Currently not in a call </ng-template>
  </div>`,
})
export class AppComponent implements OnInit, OnDestroy {
  ownMediaStream?: MediaStream;
  user$: Observable<any>;
  activeCall: Call | undefined;
  private subscriptions: Subscription[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private videoService: StreamVideoService,
    private ngZone: NgZone,
  ) {
    this.user$ = this.videoService.user$;

    this.subscriptions.push(
      this.videoService.activeCall$.subscribe((c: Call | undefined) => {
        return (this.activeCall = c);
      }),
    );
  }

  async ngOnInit() {
    const apiKey = environment.apiKey;
    const token = environment.token;
    const user = environment.user;
    const baseCoordinatorUrl = environment.coordinatorUrl;
    const baseWsUrl = environment.wsUrl;
    const client = this.videoService.init(
      apiKey,
      token,
      baseCoordinatorUrl,
      baseWsUrl,
    );
    await client.connect(apiKey, token, user);
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe(async (params) => {
        if (params['callid']) {
          const callId = params['callid'];
          await this.joinCall(callId);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.activeCall?.leave();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private async joinCall(id: string, type = 'default') {
    const call = await this.ngZone.runOutsideAngular(() => {
      return this.videoService.videoClient?.joinCall({
        id,
        type,
        datacenterId: '',
      });
    });
    await call?.join();
  }
}
