import { Injectable, NgZone } from '@angular/core';
import { VideoClientService } from './video-client.service';
import { Call, StreamSfuClient } from '@stream-io/video-client';
import { BehaviorSubject, Observable, take, tap } from 'rxjs';
import { CallParticipant } from './types';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { VideoDimension } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';

@Injectable({
  providedIn: 'root',
})
export class CallService {
  call$: Observable<Call | undefined>;
  participants$: Observable<CallParticipant[]>;
  private callSubject = new BehaviorSubject<Call | undefined>(undefined);
  private participantsSubject = new BehaviorSubject<CallParticipant[]>([]);
  private trackSubscriptions: {
    [key: string]: { width: number; height: number };
  } = {};

  constructor(
    private clientService: VideoClientService,
    private ngZone: NgZone,
  ) {
    this.call$ = this.callSubject.asObservable();
    this.participants$ = this.participantsSubject.asObservable();
    this.participants$
      .pipe(
        tap(() => {
          this.updateTrackSubscriptions();
        }),
      )
      .subscribe();
  }

  async joinCall(id: string, type: string, ownMediaStream: MediaStream) {
    const callToJoin = await this.ngZone.runOutsideAngular(async () => {
      return await this.clientService.client?.joinCall({
        id,
        type,
        // FIXME: OL: this needs to come from somewhere
        datacenterId: 'milan',
      });
    });
    if (callToJoin) {
      const { call: callEnvelope, edges } = callToJoin;
      if (!callEnvelope || !callEnvelope.call || !edges) return;
      const edge = await this.ngZone.runOutsideAngular(async () => {
        return await this.clientService.client?.getCallEdgeServer(
          callEnvelope.call!,
          edges,
        );
      });
      const serverUrl = environment.sfuRpcUrl;
      const client = new StreamSfuClient(
        serverUrl,
        edge!.credentials!.token,
        uuidv4(),
      );
      const call = this.ngZone.runOutsideAngular(() => {
        return new Call(client, this.user.name, {
          connectionConfig:
            this.toRtcConfiguration(edge!.credentials!.iceServers) ||
            this.defaultRtcConfiguration(serverUrl),
        });
      });
      this.callSubject.next(call);
      call.handleOnTrack = (e: RTCTrackEvent) => {
        this.ngZone.run(() => {
          const [primaryStream] = e.streams;
          const [name] = primaryStream.id.split(':');
          let participant = this.participants.find((s) => s.name === name);
          participant![e.track.kind as 'video' | 'audio'] = primaryStream;
          this.participantsSubject.next([...this.participants]);
        });
      };
      this.participantsSubject.next([
        {
          name: this.user.name as string,
          isLoggedInUser: true,
          audio: ownMediaStream,
          video: ownMediaStream,
        },
      ]);
      this.watchForCallEvents();
      const callState = await this.ngZone.runOutsideAngular(async () => {
        return await call.join();
      });
      this.participantsSubject.next([
        ...this.participants,
        ...(callState?.participants || [])
          .filter((p) => p.user?.id !== this.user.name)
          .map((p) => ({ name: p.user?.id || '', isLoggedInUser: false })),
      ]);
      this.ngZone.runOutsideAngular(() => {
        this.call!.publish(ownMediaStream, ownMediaStream);
      });
    }
  }

  updateVideoDimensionOfCallParticipants(
    videoDimensions: { name: string; videoDimension: VideoDimension }[],
  ) {
    this.participantsSubject.next(
      this.participants.map((p) => {
        const videoDimension =
          videoDimensions.find((vd) => vd.name === p.name)?.videoDimension ||
          p.videoDimension;
        return { ...p, videoDimension };
      }),
    );
  }

  private watchForCallEvents() {
    if (!this.call) {
      return;
    }
    this.call.on('dominantSpeakerChanged', console.warn);
    this.call.on('participantLeft', (e) => {
      this.ngZone.run(() => {
        const participantLeft = (e.eventPayload as any).participantLeft
          .participant;
        if (participantLeft.user.id === this.user?.name) {
          return;
        }
        this.participantsSubject.next(
          this.participants.filter((s) => s.name !== participantLeft.user.id),
        );
      });
    });
    this.call.on('participantJoined', (e) => {
      this.ngZone.run(() => {
        const participantJoined = (e.eventPayload as any).participantJoined
          .participant;
        if (participantJoined.user.id === this.user?.name) {
          return;
        }
        this.participantsSubject.next([
          ...this.participants,
          { name: participantJoined?.user?.id, isLoggedInUser: false },
        ]);
      });
    });
  }

  private updateTrackSubscriptions() {
    const subscriptions: { [key: string]: { width: number; height: number } } =
      {};
    this.participants.forEach((p) => {
      if (p.name !== this.user?.name && p.videoDimension) {
        subscriptions[p.name] = {
          width: p.videoDimension.width,
          height: p.videoDimension.height,
        };
      }
    });
    if (
      Object.keys(subscriptions).length > 0 &&
      this.call &&
      JSON.stringify(subscriptions) !== JSON.stringify(this.trackSubscriptions)
    ) {
      console.log('Updating subscriptions', subscriptions);
      this.trackSubscriptions = subscriptions;
      this.call.updateSubscriptions(this.trackSubscriptions);
    }
  }

  private toRtcConfiguration(config: any) {
    if (!config || config.length === 0) return undefined;
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
    } catch (e) {
      console.warn(`Invalid URL. Can't extract hostname from it.`, e);
      return url;
    }
  }

  private get user() {
    let clientUser: any;
    this.clientService.user$.pipe(take(1)).subscribe((u) => (clientUser = u));
    return clientUser;
  }

  private get call() {
    return this.callSubject.getValue();
  }

  private get participants() {
    return this.participantsSubject.getValue();
  }
}
