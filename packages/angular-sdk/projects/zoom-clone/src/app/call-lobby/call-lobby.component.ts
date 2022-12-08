import { Component, OnDestroy, OnInit } from '@angular/core';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { Subscription } from 'rxjs';
import {
  DeviceManagerService,
  MediaStreamState,
} from '../device-manager.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-call-lobby',
  templateUrl: './call-lobby.component.html',
  styleUrls: ['./call-lobby.component.scss'],
})
export class CallLobbyComponent implements OnInit, OnDestroy {
  videoStream?: MediaStream;
  videoState?: MediaStreamState;
  videoErrorMessage?: string;
  audioStream?: MediaStream;
  audioState?: MediaStreamState;
  audioErrorMessage?: string;
  isSpeaking = false;
  joinOrCreate: 'join' | 'create' = 'create';
  private joinCallId?: string;
  private subscripitions: Subscription[] = [];

  constructor(
    private deviceManager: DeviceManagerService,
    private streamVideoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.deviceManager.startVideo();
    this.deviceManager.startAudio();
    this.subscripitions.push(
      this.deviceManager.videoStream$.subscribe((s) => (this.videoStream = s)),
    );
    this.subscripitions.push(
      this.deviceManager.videoState$.subscribe((s) => (this.videoState = s)),
    );
    this.subscripitions.push(
      this.deviceManager.videoErrorMessage$.subscribe(
        (s) => (this.videoErrorMessage = s),
      ),
    );
    this.subscripitions.push(
      this.deviceManager.audioStream$.subscribe((s) => (this.audioStream = s)),
    );
    this.subscripitions.push(
      this.deviceManager.audioState$.subscribe((s) => (this.audioState = s)),
    );
    this.subscripitions.push(
      this.deviceManager.audioErrorMessage$.subscribe(
        (s) => (this.audioErrorMessage = s),
      ),
    );
    this.subscripitions.push(
      this.deviceManager.isSpeaking$.subscribe((s) => (this.isSpeaking = s)),
    );

    this.activatedRoute.queryParams.subscribe((params) => {
      this.joinCallId = params['callid'];
      this.joinOrCreate = this.joinCallId ? 'join' : 'create';
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscripitions.forEach((s) => s.unsubscribe());
  }

  async startCall() {
    try {
      let callId: string;
      if (this.joinOrCreate === 'create') {
        const callMeta = await this.streamVideoService.videoClient?.createCall({
          type: 'default',
        });
        callId = callMeta!.call!.id;
      } else {
        callId = this.joinCallId!;
      }
      await this.joinCall(callId);
    } catch (err) {
      this.snackBar.open(`Call couldn't be started`);
    }
  }

  private async joinCall(callId: string) {
    const call = await this.streamVideoService.videoClient?.joinCall({
      id: callId,
      type: 'default',
      datacenterId: '',
    });
    await call?.join();
    this.snackBar.open(
      `Send this link to others to join: ${window.location.host}/call?callid=${callId}`,
      'Dismiss',
    );
    this.router.navigate(['call'], { queryParams: { callid: callId } });
  }
}
