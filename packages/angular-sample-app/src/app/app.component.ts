import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
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
  private subscriptions: Subscription[] = [];

  constructor(private activatedRoute: ActivatedRoute, private clientService: VideoClientService, private callService: CallService) {
    this.participantStreams$ = this.callService.participantStreams$;
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
    const apiKey = 'key10';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci9tYXJjZWxvIiwiaWF0IjoxNjYzNzc1MjA4LCJ1c2VyX2lkIjoibWFyY2VsbyJ9.1g7cO9RV4f89zeaRXa7ED2WyAKQ6DX3Pj1Qlbt5N8hg';
    const user = {
      name: 'marcelo',
      role: 'admin',
      teams: ['team-1, team-2'],
      imageUrl: '/profile.png',
      customJson: new Uint8Array(),
    };
    const baseUrl = '/rpc';
    return this.clientService.connect(apiKey, token, user, baseUrl);
  }

  private async getOwnMediaStream() {
    const constraints = { audio: true, video: { width: 1280, height: 720 } };
    this.ownMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  }
}
