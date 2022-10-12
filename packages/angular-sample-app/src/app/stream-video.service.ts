import { Injectable } from '@angular/core';
import {
  StreamVideoClient,
  streamVideoReadonlyStateStore,
  UserInput,
} from '@stream-io/video-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreamVideoService {
  user$: Observable<UserInput | undefined>;
  videoClient: StreamVideoClient | undefined;

  constructor() {
    this.user$ = streamVideoReadonlyStateStore.connectedUser$;
  }

  init(
    apiKey: string,
    token: string,
    baseCoordinatorUrl: string,
    baseWsUrl: string,
  ) {
    return new StreamVideoClient(apiKey, {
      coordinatorRpcUrl: baseCoordinatorUrl,
      coordinatorWsUrl: baseWsUrl,
      sendJson: true,
      token,
    });
  }
}
