import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Call } from '@stream-io/video-client';
import { VideoDimension } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { StreamVideoParticipant } from '@stream-io/video-client/dist/src/rtc/types';

@Component({
  selector: 'stream-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss'],
})
export class ParticipantComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() participant?: StreamVideoParticipant;
  @Input() call?: Call;
  @ViewChild('video')
  private videoElement!: ElementRef<HTMLElement> | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private isViewInited = false;
  @HostBinding() class = 'str-video__participant-angular-host';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['participant']?.previousValue?.isLoggedInUser &&
      !changes['participant']?.currentValue?.isLoggedInUser &&
      this.isViewInited
    ) {
      this.registerResizeObserver();
    }
  }

  ngAfterViewInit(): void {
    this.isViewInited = true;
    if (!this.participant?.isLoggedInUser) {
      this.registerResizeObserver();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private registerResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.resizeObserver = new ResizeObserver(() =>
      this.updateTrackSubscriptions(),
    );
    this.resizeObserver.observe(this.videoElement!.nativeElement);
  }

  private updateTrackSubscriptions() {
    this.call?.updateSubscriptionsPartial({
      [this.participant?.sessionId || '']: {
        videoDimension: this.videoDimension,
      },
    });
  }

  private get videoDimension(): VideoDimension {
    const element = this.videoElement!.nativeElement;
    return { width: element.clientWidth, height: element.clientHeight };
  }
}
