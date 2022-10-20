import { AfterViewChecked, Component, OnDestroy, OnInit } from '@angular/core';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { VideoDimension } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { Observable, Subscription, tap } from 'rxjs';
import { StreamVideoService } from '../stream-video.service';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, AfterViewChecked, OnDestroy {
  call: Call | undefined;
  participants$: Observable<StreamVideoParticipant[]>;
  private subscriptions: Subscription[] = [];

  constructor(private streamVideoService: StreamVideoService) {
    this.participants$ = this.streamVideoService.activeCallParticipants$.pipe(
      tap(console.log),
    );
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        this.call = c;
        const ownMediaStream = await this.getOwnMediaStream();
        this.call?.publish(ownMediaStream, ownMediaStream);
      }),
    );
    this.subscriptions.push(
      this.streamVideoService.pendingCalls$.subscribe((calls) => {
        if (this.call) {
          this.call.leave();
        }
        if (calls.length === 1) {
          calls[0].join();
        }
      }),
    );
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    console.log('change detector ran');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  trackByParticipantId(_: number, item: StreamVideoParticipant) {
    return item.user?.name || undefined + item.sessionId;
  }

  videoDimensionsChanged(
    participant: StreamVideoParticipant,
    dimension: VideoDimension,
  ) {
    this.call?.updateVideoDimension(participant, dimension);
  }

  private async getOwnMediaStream() {
    const constraints = { audio: true, video: { width: 1280, height: 720 } };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }
}
