import {
  Component,
  NgZone,
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
import { ChannelService, ChatClientService } from 'stream-chat-angular';
import { UserService } from '../user.service';
import { CallMetadata } from '@stream-io/video-client';

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
  callMeta?: CallMetadata;
  isJoinOrCreateInProgress = false;
  private subscripitions: Subscription[] = [];
  @ViewChild('invite') private inviteRef!: TemplateRef<any>;
  private snackBarRef?: MatSnackBarRef<any>;

  constructor(
    private deviceManager: DeviceManagerService,
    private streamVideoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ngZone: NgZone,
    private channelService: ChannelService,
    private chatClientService: ChatClientService,
    private userService: UserService,
  ) {
    this.deviceManager.initAudioDevices();
    this.deviceManager.initVideoDevices();
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
            await this.streamVideoService.videoClient?.getOrCreateCall(
              callid,
              'default',
            );
          // FIXME OL: adjust to new API
          // this.callMeta = response?.call;
        } catch (error: any) {
          this.snackBar.open(`Couldn't establish connection, ${error.message}`);
        }
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscripitions.forEach((s) => s.unsubscribe());
  }

  get inviteLink() {
    return `${window.location.host}/call?callid=${this.callMeta?.call.id}`;
  }

  copyLink() {
    navigator.clipboard.writeText(this.inviteLink);
    this.snackBarRef?.dismiss();
  }

  async startOrJoinCall() {
    this.isJoinOrCreateInProgress = true;
    try {
      let callId: string;
      if (this.joinOrCreate === 'create') {
        const response =
          await this.streamVideoService.videoClient?.getOrCreateCall(
            String(Math.round(Math.random() * 100000)),
            'default',
            {
              ring: false,
            },
          );
        callId = response!.call.id!;
      } else {
        callId = this.callMeta!.call.id;
      }
      await this.joinCall(callId);
      if (this.joinOrCreate === 'create') {
        this.snackBarRef = this.snackBar.openFromTemplate(this.inviteRef, {
          duration: 10000,
        });
      }
      this.isJoinOrCreateInProgress = false;
      this.router.navigate(['call'], { queryParams: { callid: callId } });
    } catch (err: any) {
      this.isJoinOrCreateInProgress = false;
      this.snackBar.open(`Call couldn't be started, ${err.message}`);
    }
  }

  private async joinCall(callId: string) {
    await this.ngZone.runOutsideAngular(() => {
      return this.streamVideoService.videoClient?.joinCall(callId, 'default');
    });
    if (this.joinOrCreate === 'create') {
      const channel = this.chatClientService.chatClient.channel(
        'messaging',
        callId,
        // TODO: hacky workaround for permission problems
        { members: this.userService.users.map((u) => u.user.id) },
      );
      await channel.create();
    }
    await this.channelService.init({ id: { $eq: callId } });
  }
}
