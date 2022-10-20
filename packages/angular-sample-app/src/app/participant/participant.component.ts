import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { VideoDimension } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { StreamVideoParticipant } from '@stream-io/video-client/dist/src/rtc/types';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss'],
})
export class ParticipantComponent implements OnInit, AfterViewInit {
  @Input() participant?: StreamVideoParticipant;
  @ViewChild('videoPlaceholder')
  private videoPlaceholder!: ElementRef<HTMLElement>;
  @Output() videoDimensionsChange = new EventEmitter<VideoDimension>();

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.videoPlaceholder?.nativeElement) {
      return;
    }
    this.videoDimensionsChange.emit({
      width: this.videoPlaceholder.nativeElement.clientWidth,
      height: this.videoPlaceholder.nativeElement.clientHeight,
    });
  }
}
