import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import {
  StreamVideoService,
  InCallDeviceManagerService,
  DeviceManagerService,
} from '@stream-io/video-angular-sdk';
import {
  Call,
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { combineLatest, map, Observable, Subscription } from 'rxjs';
import { ChatClientService, getChannelDisplayText } from 'stream-chat-angular';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, OnDestroy {
  call: Call | undefined;
  remoteParticipants$: Observable<StreamVideoParticipant[]>;
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  hasScreenshare$: Observable<boolean>;
  screenSharingParticipant$: Observable<StreamVideoParticipant | undefined>;
  TrackType = SfuModels.TrackType;
  isLocalParticipantCallOwner = false;
  isCallRecordingInProgress = false;
  channelName?: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private inCallDeviceManager: InCallDeviceManagerService,
    private snackBar: MatSnackBar,
    private deviceManager: DeviceManagerService,
    private chatClientService: ChatClientService,
  ) {
    this.inCallDeviceManager.start();
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => {
        if (c) {
          this.call = c;
          const channelId = this.call?.data.call.custom?.['channelId'];
          this.chatClientService.chatClient
            .queryChannels({ id: channelId }, undefined, { watch: false })
            .then((response) => {
              const channel = response[0];
              this.channelName = getChannelDisplayText(
                channel,
                this.chatClientService.chatClient.user!,
              );
            });
        } else {
          this.call = undefined;
        }
      }),
    );
    this.remoteParticipants$ = this.streamVideoService.remoteParticipants$;
    this.localParticipant$ = this.streamVideoService.localParticipant$;
    this.subscriptions.push(
      combineLatest([
        this.streamVideoService.user$,
        this.streamVideoService.activeCall$,
      ]).subscribe(([user, activeCall]) => {
        this.isLocalParticipantCallOwner = !!(
          user &&
          activeCall &&
          user?.id === activeCall.data.call.created_by.id
        );
      }),
    );
    this.hasScreenshare$ = this.streamVideoService.hasOngoingScreenShare$;
    this.screenSharingParticipant$ = this.streamVideoService.participants$.pipe(
      map((participants) =>
        participants.find((p) =>
          p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
        ),
      ),
    );
    let snackBarRef: MatSnackBarRef<any>;
    this.subscriptions.push(
      combineLatest([
        this.deviceManager.audioState$,
        this.deviceManager.isSpeaking$,
      ]).subscribe(([audioState, isSpeaking]) => {
        const isSpeakingWhileMuted =
          audioState === 'detecting-speech-while-muted' && isSpeaking;
        if (isSpeakingWhileMuted) {
          snackBarRef = this.snackBar.open(
            `You're muted, unmute yourself to speak.`,
          );
        } else if (snackBarRef) {
          snackBarRef.dismiss();
        }
      }),
    );
    this.subscriptions.push(
      this.streamVideoService.callRecordingInProgress$.subscribe(
        (inProgress) => (this.isCallRecordingInProgress = inProgress),
      ),
    );
  }

  endCall() {
    this.streamVideoService.videoClient?.cancelCall(this.call!.data.call.cid!);
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.inCallDeviceManager.stop();
  }

  trackBySessionId(_: number, item: StreamVideoParticipant) {
    return item.sessionId;
  }
}
