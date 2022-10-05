import { Injectable, NgZone } from '@angular/core';
import { StreamVideoClient } from '@stream-io/video-client';
import { WebsocketHealthcheck } from '@stream-io/video-client/dist/src/gen/video/coordinator/client_v1_rpc/websocket';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoClientService {
  client?: StreamVideoClient;
  user$: Observable<any | undefined>;
  private userSubject = new BehaviorSubject<any | undefined>(undefined);
  private webSocketHealthCheck?: WebsocketHealthcheck;

  constructor(private ngZone: NgZone) {
    this.user$ = this.userSubject.asObservable();
  }

  async connect(apiKey: string, token: string, user: any, baseCoordinatorUrl: string, baseWsUrl: string) {
    await this.ngZone.runOutsideAngular(async () => {
      this.client = new StreamVideoClient(apiKey, {
        coordinatorRpcUrl: baseCoordinatorUrl,
        coordinatorWsUrl: baseWsUrl,
        sendJson: true,
        token,
      });
      await this.client.connect(apiKey, token, user);
    });
    this.userSubject.next(user);
    this.client?.on('healthcheck', (message: WebsocketHealthcheck) => {
      this.webSocketHealthCheck = message;
      this.setHealthcheckPayload();
    });
  }

  setHealthcheckPayload(callId?: string) {
    this.webSocketHealthCheck = {
      ...this.webSocketHealthCheck!,
      callId: callId || '',
      callType: 'default',
      audio: true,
      video: true,
    };

    this.client?.setHealthcheckPayload(WebsocketHealthcheck.toBinary(this.webSocketHealthCheck));
  }
}
