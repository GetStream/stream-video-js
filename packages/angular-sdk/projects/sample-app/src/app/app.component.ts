import { Component, NgZone, OnInit } from '@angular/core';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { environment } from '../environments/environment';
import { distinctUntilKeyChanged } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <div>
        <input #input /><button (click)="createOrJoinCall(input.value)">
          Create or join call
        </button>
      </div>
      <div>Call ID: {{ callId }}</div>
      <stream-call></stream-call>
    </div>
  `,
})
export class AppComponent implements OnInit {
  callId?: string;

  constructor(
    private streamVideoService: StreamVideoService,
    private ngZone: NgZone,
  ) {
    this.streamVideoService.participants$
      .pipe(distinctUntilKeyChanged('length'))
      .subscribe((participants) =>
        console.log(
          `There are ${participants?.length || 0} participant(s) in the call`,
        ),
      );
  }

  async ngOnInit() {
    const apiKey = environment.apiKey;
    const token = environment.token;
    const user = environment.user;
    const baseCoordinatorUrl = environment.coordinatorUrl;
    const baseWsUrl = environment.wsUrl;
    const client = this.streamVideoService.init(
      apiKey,
      token,
      baseCoordinatorUrl,
      baseWsUrl,
    );
    await client.connect(apiKey, token, user);
  }

  async createOrJoinCall(callId?: string) {
    if (!callId) {
      callId = await this.createCall();
    }
    this.callId = callId;
    this.joinCall(callId);
  }

  private async createCall() {
    const response = await this.streamVideoService.videoClient?.createCall({
      type: 'default',
    });
    const callId = response?.call?.id;
    return callId;
  }

  private async joinCall(callId?: string) {
    if (!callId) {
      return;
    }
    await this.ngZone.runOutsideAngular(() => {
      return this.streamVideoService.videoClient?.joinCall({
        id: callId,
        type: 'default',
        datacenterId: '',
      });
    });
  }
}
