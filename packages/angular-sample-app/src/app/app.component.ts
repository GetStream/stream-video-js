import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StreamVideoClient } from '@stream-io/video-client';
import { Call, Client, User } from '@stream-io/video-client-sfu';
import { Participant } from '@stream-io/video-client-sfu/dist/src/gen/sfu_models/models';
import { WebsocketHealthcheck } from '@stream-io/video-client/dist/src/gen/video/coordinator/client_v1_rpc/websocket';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  client: StreamVideoClient | undefined;
  ownMediaStream?: MediaStream;
  mediaStreamsOfParticipants: {name?: string, audio?: MediaStream, video?: MediaStream}[] = [];
  private subscriptions: Subscription[] = [];
  private user: any;
  private call?: Call;
  private callId?: string;
  private webSocketHealthCheck?: WebsocketHealthcheck;

  constructor(private activatedRoute: ActivatedRoute) {

  }

  async ngOnInit() {
    await this.connect();
    await this.getOwnMediaStream();
    this.subscriptions.push(this.activatedRoute.queryParams.subscribe(params => {
      if (params['callid']) {
        this.callId = params['callid'];
        this.joinCall(this.callId!);
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.call?.leave();
  }

  private async joinCall(id: string, type = 'default') {
    try {
      const callToJoin = await this.client?.joinCall({
        id,
        type,
        // FIXME: OL: this needs to come from somewhere
        datacenterId: 'milan',
      });
      if (callToJoin) {
        const { call: callEnvelope, edges } = callToJoin;
        if (!callEnvelope || !callEnvelope.call || !edges) return;
        const edge = await this.client?.getCallEdgeServer(
          callEnvelope.call,
          edges,
        );
        const user = new User(this.user.name, edge!.credentials!.token);
        const serverUrl = 'http://localhost:3031/twirp';
        const client = new Client(serverUrl, user);
        this.call = new Call(client, {
          connectionConfig:
            this.toRtcConfiguration(edge!.credentials!.iceServers) ||
            this.defaultRtcConfiguration(serverUrl),
        });
        this.call.handleOnTrack = ((e: RTCTrackEvent) => {
          const [primaryStream] = e.streams;
          const [name] = primaryStream.id.split(':');
          let participantStream = this.mediaStreamsOfParticipants.find(s => s.name === name);
          if (!participantStream) {
            participantStream = {name};
            this.mediaStreamsOfParticipants.push(participantStream);
          }
          participantStream![e.track.kind as 'video' | 'audio'] = primaryStream;
        });
        this.call.on('participantLeft', e => {
          const participantLeft = (e.eventPayload as any).participantLeft.participant;
          this.updateTrackSubscriptions((callState?.participants || []).filter(p => p.user?.id !== participantLeft.user.id));
          this.mediaStreamsOfParticipants = this.mediaStreamsOfParticipants.filter(s => s.name !== participantLeft.user.id);
        });
        this.call.on('participantJoined', e => {
          this.updateTrackSubscriptions([(e.eventPayload as any).participantJoined.participant, ...(callState?.participants || [])]);
        });
        const callState = await this.call.join();
        this.call.publish(this.ownMediaStream, this.ownMediaStream);
        this.updateTrackSubscriptions(callState?.participants || []);
        console.log(`Joined call ${id}`);
      }
    } catch (err) {
      console.error(`Failed to join call`, err);
    }
  }

  private async connect() {
    const apiKey = 'key10';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci9tYXJjZWxvIiwiaWF0IjoxNjYzNzc1MjA4LCJ1c2VyX2lkIjoibWFyY2VsbyJ9.1g7cO9RV4f89zeaRXa7ED2WyAKQ6DX3Pj1Qlbt5N8hg';
    this.user = {
      name: 'marcelo',
      role: 'admin',
      teams: ['team-1, team-2'],
      imageUrl: '/profile.png',
      customJson: new Uint8Array(),
    };
    this.client = new StreamVideoClient(apiKey, {
      baseUrl: '/rpc',
      sendJson: true,
      token,
    });
    try {
      await this.client.connect(apiKey, token, this.user);
      this.client?.on('healthcheck', (message: WebsocketHealthcheck) => {
        this.webSocketHealthCheck = message;
        const payload: WebsocketHealthcheck = {
          ...this.webSocketHealthCheck!,
          callId: this.callId!,
          callType: 'default',
          audio: true,
          video: true,
        };

        this.client?.setHealthcheckPayload(WebsocketHealthcheck.toBinary(payload));
      });
      console.log('Successful connection');
    } catch (error) {
      console.error('Error while connecting', error);
    }
  }

  private async getOwnMediaStream() {
    const constraints = { audio: true, video: { width: 1280, height: 720 } };
    this.ownMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  }

  private toRtcConfiguration(config: any) {
    if (!config || config.length === 0)
        return undefined;
    const rtcConfig = {
        iceServers: config.map((ice: any) => ({
            urls: ice.urls,
            username: ice.username,
            credential: ice.password,
        })),
    };
    return rtcConfig;
  }
  private defaultRtcConfiguration(sfuUrl: any) {
    return {
      iceServers: [
          {
              urls: 'stun:stun.l.google.com:19302',
          },
          {
              urls: `turn:${this.hostnameFromUrl(sfuUrl)}:3478`,
              username: 'video',
              credential: 'video',
          },
      ],
    };
  }

  private hostnameFromUrl(url: string) {
    try {
      return new URL(url).hostname;
    }
    catch (e) {
        console.warn(`Invalid URL. Can't extract hostname from it.`, e);
        return url;
    }
  }

  private updateTrackSubscriptions(participants: Participant[]) {
    console.warn(participants);
    const subscriptions: {[key: string]: {width: number, height: number}} = {};
    participants.forEach(p => {
      if (p.user!.id !== this.user?.name) {
        subscriptions[p.user!.id] = {width: 640, height: 480}
      }
    })
    this.call?.updateSubscriptions(subscriptions);
  }
}
