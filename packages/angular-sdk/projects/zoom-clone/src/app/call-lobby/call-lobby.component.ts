import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  StreamVideoService,
  DeviceManagerService,
  MediaStreamState,
  AudioMediaStreamState,
} from '@stream-io/video-angular-sdk';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CallMeta } from '@stream-io/video-client';

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
  audioState?: AudioMediaStreamState;
  audioErrorMessage?: string;
  isSpeaking = false;
  joinOrCreate: 'join' | 'create' = 'create';
  callMeta?: CallMeta.Call;
  private subscripitions: Subscription[] = [];
  @ViewChild('invite') private inviteRef!: TemplateRef<any>;
  private snackBarRef?: MatSnackBarRef<any>;

  constructor(
    private deviceManager: DeviceManagerService,
    private streamVideoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute,
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

    this.activatedRoute.queryParams.subscribe(async (params) => {
      const callid = params['callid'];
      this.joinOrCreate = callid ? 'join' : 'create';
      if (this.joinOrCreate === 'join') {
        try {
          const response =
            await this.streamVideoService.videoClient?.getOrCreateCall({
              type: 'default',
              id: callid,
            });
          this.callMeta = response?.call;
        } catch (error) {
          this.snackBar.open(`Couldn't establish connection`);
        }
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscripitions.forEach((s) => s.unsubscribe());
  }

  get inviteLink() {
    return `${window.location.host}/call?callid=${this.callMeta?.id}`;
  }

  copyLink() {
    navigator.clipboard.writeText(this.inviteLink);
    this.snackBarRef?.dismiss();
  }

  async startCall() {
    try {
      let callId: string;
      if (this.joinOrCreate === 'create') {
        const response = await this.streamVideoService.videoClient?.createCall({
          type: 'default',
        });
        this.callMeta = response?.call;
        callId = this.callMeta!.id;
      } else {
        callId = this.callMeta!.id;
      }
      await this.joinCall(callId);
      if (this.joinOrCreate === 'create') {
        this.snackBarRef = this.snackBar.openFromTemplate(this.inviteRef, {
          duration: 10000,
        });
      }
      this.router.navigate(['call'], { queryParams: { callid: callId } });
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
  }
}
