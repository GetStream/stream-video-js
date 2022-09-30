import { Injectable } from '@angular/core';
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

  constructor() {
    this.user$ = this.userSubject.asObservable();
  }

  async connect(apiKey: string, token: string, user: any, baseUrl: string) {
    this.client = new StreamVideoClient(apiKey, {
      baseUrl,
      sendJson: true,
      token,
    });
    await this.client.connect(apiKey, token, user);
    this.userSubject.next(user);
    this.client?.on('healthcheck', (message: WebsocketHealthcheck) => {
      this.webSocketHealthCheck = message;
      const payload: WebsocketHealthcheck = {
        ...this.webSocketHealthCheck!,
        callId: '',
        callType: 'default',
        audio: true,
        video: true,
      };

      this.client?.setHealthcheckPayload(WebsocketHealthcheck.toBinary(payload));
    });
  }
}
