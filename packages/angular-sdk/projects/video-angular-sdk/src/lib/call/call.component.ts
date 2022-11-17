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
  localParticipant$: Observable<StreamVideoParticipant | undefined>;
  private subscriptions: Subscription[] = [];

  constructor(private streamVideoService: StreamVideoService) {
    this.localParticipant$ =
      this.streamVideoService.activeCallLocalParticipant$;
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        if (c) {
          this.call = c;
          const ownMediaStream = await this.getOwnMediaStream();
          this.call.publishMediaStreams(ownMediaStream, ownMediaStream);
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

  private async getOwnMediaStream() {
    const constraints = { audio: true, video: { width: 960, height: 540 } };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }
}
