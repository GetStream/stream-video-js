import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { VideoDimension } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { StreamVideoParticipant } from '@stream-io/video-client/dist/src/rtc/types';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss'],
})
export class ParticipantComponent implements OnInit {
  @Input() participant?: StreamVideoParticipant;
  @ViewChild('videoPlaceholder')
  private videoPlaceholderElement: ElementRef<HTMLElement> | undefined;
  @ViewChild('video')
  private videoElement!: ElementRef<HTMLElement> | undefined;

  ngOnInit(): void {}

  get videoDimension(): VideoDimension {
    const element =
      this.videoPlaceholderElement?.nativeElement ||
      this.videoElement?.nativeElement;
    return { width: element!.clientWidth, height: element!.clientHeight };
  }
}
