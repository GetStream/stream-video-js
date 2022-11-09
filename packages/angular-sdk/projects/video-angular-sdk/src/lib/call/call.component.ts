import { AfterViewChecked, Component, OnDestroy, OnInit } from '@angular/core';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { Observable, Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, AfterViewChecked, OnDestroy {
  call!: Call;
  participants$: Observable<StreamVideoParticipant[]>;
  localParticipant$: Observable<StreamVideoParticipant | undefined>;
  private subscriptions: Subscription[] = [];
  private participantsContainerResizeObserver: ResizeObserver | undefined;

  constructor(private streamVideoService: StreamVideoService) {
    this.participants$ = this.streamVideoService.activeCallRemoteParticipants$;
    this.localParticipant$ =
      this.streamVideoService.activeCallLocalParticipant$;
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        this.call = c!;
        const ownMediaStream = await this.getOwnMediaStream();
        this.call.publish(ownMediaStream, ownMediaStream);
      }),
    );
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    console.log('change detector ran');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.participantsContainerResizeObserver?.disconnect();
  }

  trackByParticipantId(_: number, item: StreamVideoParticipant) {
    return item.user?.name || undefined + item.sessionId;
  }

  private async getOwnMediaStream() {
    const constraints = { audio: true, video: { width: 1280, height: 720 } };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }
}
