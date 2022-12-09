import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import {
  Call,
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { combineLatest, Observable, Subscription, take } from 'rxjs';
import { DeviceManagerService } from '../device-manager.service';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, OnDestroy {
  call!: Call;
  remoteParticipants$: Observable<StreamVideoParticipant[]>;
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  TrackType = SfuModels.TrackType;
  isLocalParticipantCallOwner = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private deviceManager: DeviceManagerService,
    private router: Router,
  ) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => (this.call = c!)),
    );
    this.remoteParticipants$ =
      this.streamVideoService.activeCallRemoteParticipants$;
    this.localParticipant$ =
      this.streamVideoService.activeCallLocalParticipant$;
    this.subscriptions.push(
      this.deviceManager.videoState$.subscribe((s) => {
        if (s === 'on') {
          this.deviceManager.videoStream$
            .pipe(take(1))
            .subscribe((stream) => this.call.publishVideoStream(stream!));
        } else {
          this.call.stopPublish(SfuModels.TrackType.VIDEO);
        }
      }),
    );
    this.subscriptions.push(
      this.deviceManager.audioState$.subscribe((s) => {
        if (s === 'on') {
          this.deviceManager.audioStream$
            .pipe(take(1))
            .subscribe((stream) => this.call.publishAudioStream(stream!));
        } else {
          this.call.stopPublish(SfuModels.TrackType.AUDIO);
        }
      }),
    );
    this.subscriptions.push(
      this.deviceManager.audioOutputDevice$.subscribe((d) => {
        this.call.setAudioOutputDevice(d);
      }),
    );
    this.subscriptions.push(
      combineLatest([
        this.streamVideoService.user$,
        this.streamVideoService.activeCallMeta$,
      ]).subscribe(([user, activeCallMeta]) => {
        if (
          user &&
          activeCallMeta &&
          user?.id === activeCallMeta.createdByUserId
        ) {
          this.isLocalParticipantCallOwner = true;
        } else {
          this.isLocalParticipantCallOwner = false;
        }
      }),
    );
  }

  endCall() {
    this.call.leave();
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
