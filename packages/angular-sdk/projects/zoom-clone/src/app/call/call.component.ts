import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  StreamVideoService,
  InCallDeviceManagerService,
  DeviceManagerService,
} from '@stream-io/video-angular-sdk';
import {
  Call,
  CallMeta,
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { combineLatest, map, Observable, Subscription } from 'rxjs';

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
  activeCallMeta?: CallMeta.Call;
  private subscriptions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private router: Router,
    private inCallDeviceManager: InCallDeviceManagerService,
    private snackBar: MatSnackBar,
    private deviceManager: DeviceManagerService,
  ) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => {
        if (c) {
          this.call = c;
          this.inCallDeviceManager.start();
        } else {
          this.inCallDeviceManager.stop();
          this.call = undefined;
        }
      }),
    );
    this.remoteParticipants$ = this.streamVideoService.remoteParticipants$;
    this.localParticipant$ = this.streamVideoService.localParticipant$;
    this.subscriptions.push(
      combineLatest([
        this.streamVideoService.user$,
        this.streamVideoService.acceptedCall$,
      ]).subscribe(([user, acceptedCall]) => {
        this.isLocalParticipantCallOwner = !!(
          user &&
          acceptedCall &&
          user?.id === acceptedCall.senderUserId
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
        console.warn(audioState, isSpeaking);
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
    this.call?.leave();
    this.router.navigateByUrl('/call-lobby');
  }

  toggleRecording() {
    this.isCallRecordingInProgress
      ? this.streamVideoService.videoClient?.stopRecording(
          this.activeCallMeta!.id,
          this.activeCallMeta!.type,
        )
      : this.streamVideoService.videoClient?.startRecording(
          this.activeCallMeta!.id,
          this.activeCallMeta!.type,
        );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  trackBySessionId(_: number, item: StreamVideoParticipant) {
    return item.sessionId;
  }

  toggleAudioMuteState(userId: string, isMuted: boolean) {
    alert('Not yet supported');
  }

  toggleVideoMuteState(userId: string, isMuted: boolean) {
    alert('Not yet supported');
  }

  muteAll() {
    alert('Not yet supported');
  }
}
