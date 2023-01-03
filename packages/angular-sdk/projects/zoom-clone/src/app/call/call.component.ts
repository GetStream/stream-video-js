import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  StreamVideoService,
  InCallDeviceManagerService,
} from '@stream-io/video-angular-sdk';
import {
  Call,
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
  private subscriptions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private router: Router,
    private inCallDeviceManager: InCallDeviceManagerService,
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
  }

  endCall() {
    this.call?.leave();
    this.router.navigateByUrl('/call-lobby');
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
