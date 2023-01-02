import { Component, OnDestroy, OnInit } from '@angular/core';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { Observable, Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call-participants-screenshare-view',
  templateUrl: './call-participants-screenshare-view.component.html',
  styles: [],
})
export class CallParticipantsScreenshareViewComponent
  implements OnInit, OnDestroy
{
  firstScreenSharingParticipant: StreamVideoParticipant | undefined;
  isOverlayVisible = false;
  participants$: Observable<StreamVideoParticipant[]>;
  private subscriptions: Subscription[] = [];

  constructor(private videoService: StreamVideoService) {
    this.participants$ = this.videoService.participants$;
    this.subscriptions.push(
      this.videoService.participants$.subscribe((allParticipants) => {
        const firstScreenSharingParticipant = allParticipants.find((p) =>
          p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
        );
        if (
          firstScreenSharingParticipant?.userId !==
          this.firstScreenSharingParticipant?.userId
        ) {
          this.isOverlayVisible =
            this.firstScreenSharingParticipant?.isLoggedInUser || false;
        }
        this.firstScreenSharingParticipant = firstScreenSharingParticipant;
      }),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  trackByParticipantId(_: number, item: StreamVideoParticipant) {
    return item.userId || undefined + item.sessionId;
  }
}
