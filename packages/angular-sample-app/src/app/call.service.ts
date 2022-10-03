import { Injectable } from '@angular/core';
import { VideoClientService } from './video-client.service';
import { Call, Client, User } from '@stream-io/video-client-sfu';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { ParticipantStream } from './types';
import { Participant } from '@stream-io/video-client-sfu/src/gen/sfu_models/models';

@Injectable({
  providedIn: 'root'
})
export class CallService {
  call$: Observable<Call | undefined>;
  participantStreams$: Observable<ParticipantStream[]>;
  private callSubject = new BehaviorSubject<Call | undefined>(undefined);
  private participantStreamsSubject = new BehaviorSubject<ParticipantStream[]>([]);

  constructor(private clientService: VideoClientService) {
    this.call$ = this.callSubject.asObservable();
    this.participantStreams$ = this.participantStreamsSubject.asObservable();
  }

  async joinCall(id: string, type: string, ownMediaStream: MediaStream) {
    const callToJoin = await this.clientService.client?.joinCall({
      id,
      type,
      // FIXME: OL: this needs to come from somewhere
      datacenterId: 'milan',
    });
    if (callToJoin) {
      const { call: callEnvelope, edges } = callToJoin;
      if (!callEnvelope || !callEnvelope.call || !edges) return;
      const edge = await this.clientService.client?.getCallEdgeServer(
        callEnvelope.call,
        edges,
      );
      const user = new User(this.user.name, edge!.credentials!.token);
      const serverUrl = 'http://localhost:3031/twirp';
      const client = new Client(serverUrl, user);
      const call = new Call(client, {
        connectionConfig:
          this.toRtcConfiguration(edge!.credentials!.iceServers) ||
          this.defaultRtcConfiguration(serverUrl),
      });
      this.callSubject.next(call);
      call.handleOnTrack = ((e: RTCTrackEvent) => {
        const [primaryStream] = e.streams;
        const [name] = primaryStream.id.split(':');
        let participantStream = this.participantStreams.find(s => s.name === name);
        if (!participantStream) {
          participantStream = {name};
          this.participantStreams.push(participantStream);
        }
        participantStream![e.track.kind as 'video' | 'audio'] = primaryStream;
      });
      call.on('participantLeft', e => {
        const participantLeft = (e.eventPayload as any).participantLeft.participant;
        this.updateTrackSubscriptions((callState?.participants || []).filter(p => p.user?.id !== participantLeft.user.id));
        this.participantStreamsSubject.next(this.participantStreams.filter(s => s.name !== participantLeft.user.id));
      });
      call.on('participantJoined', e => {
        this.updateTrackSubscriptions([(e.eventPayload as any).participantJoined.participant, ...(callState?.participants || [])]);
      });
      const callState = await call.join();
      this.call!.publish(ownMediaStream, ownMediaStream);
      this.updateTrackSubscriptions(callState?.participants || []);
    }
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
    const subscriptions: {[key: string]: {width: number, height: number}} = {};
    participants.forEach(p => {
      if (p.user!.id !== this.user?.name) {
        subscriptions[p.user!.id] = {width: 640, height: 480}
      }
    })
    this.call?.updateSubscriptions(subscriptions);
  }

  private get user() {
    let clientUser: any;
    this.clientService.user$.pipe(take(1)).subscribe(u => clientUser = u);
    return clientUser;
  }

  private get call() {
    return this.callSubject.getValue();
  }

  private get participantStreams() {
    return this.participantStreamsSubject.getValue();
  }
}
