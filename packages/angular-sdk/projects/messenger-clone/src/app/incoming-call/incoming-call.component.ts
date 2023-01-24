import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AudioMediaStreamState,
  DeviceManagerService,
  MediaStreamState,
  StreamVideoService,
} from '@stream-io/video-angular-sdk';
import { CallMeta } from '@stream-io/video-client';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-incoming-call',
  templateUrl: './incoming-call.component.html',
  styleUrls: ['./incoming-call.component.scss'],
})
export class IncomingCallComponent implements OnInit, OnDestroy {
  videoStream?: MediaStream;
  videoState?: MediaStreamState;
  videoErrorMessage?: string;
  audioStream?: MediaStream;
  audioState?: AudioMediaStreamState;
  audioErrorMessage?: string;
  isSpeaking = false;
  joinOrCreate: 'join' | 'create' = 'create';
  callMeta?: CallMeta.Call;
  isJoinOrCreateInProgress = false;
  private subscripitions: Subscription[] = [];

  constructor(
    private deviceManager: DeviceManagerService,
    private streamVideoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
  ) {
    this.deviceManager.initAudioDevices();
    this.deviceManager.initVideoDevices();
    this.deviceManager.initAudioOutputDevices();
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
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscripitions.forEach((s) => s.unsubscribe());
  }

  private async joinCall(callId: string) {
    try {
      await this.ngZone.runOutsideAngular(() => {
        return this.streamVideoService.videoClient?.joinCall({
          id: callId,
          type: 'default',
          datacenterId: '',
        });
      });
    } catch (error) {
      this.snackBar.open(`Couldn't join call`);
    }
  }
}
