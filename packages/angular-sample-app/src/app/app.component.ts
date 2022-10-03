import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CallService } from './call.service';
import { ParticipantStream } from './types';
import { VideoClientService } from './video-client.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  ownMediaStream?: MediaStream;
  participantStreams$: Observable<ParticipantStream[]>;
  user$: Observable<any>;
  private subscriptions: Subscription[] = [];

  constructor(private activatedRoute: ActivatedRoute, private clientService: VideoClientService, private callService: CallService) {
    this.participantStreams$ = this.callService.participantStreams$;
    this.user$ = this.clientService.user$;
  }

  async ngOnInit() {
    await this.connect();
    await this.getOwnMediaStream();
    this.subscriptions.push(this.activatedRoute.queryParams.subscribe(async params => {
      if (params['callid']) {
        const callId = params['callid'];
        await this.joinCall(callId);
        this.clientService.setHealthcheckPayload(callId);
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private async joinCall(id: string, type = 'default') {
    await this.callService.joinCall(id, type, this.ownMediaStream!);
  }

  private connect() {
    const apiKey = environment.apiKey;
    const token = environment.token;
    const user = environment.user
    const baseCoordinatorUrl = environment.coordinatorUrl;
    const baseWsUrl = environment.wsUrl;
    return this.clientService.connect(apiKey, token, user, baseCoordinatorUrl, baseWsUrl);
  }

  private async getOwnMediaStream() {
    const constraints = { audio: true, video: { width: 1280, height: 720 } };
    this.ownMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  }
}
