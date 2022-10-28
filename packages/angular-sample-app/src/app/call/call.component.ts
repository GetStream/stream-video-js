import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ComponentRef,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  Call,
  StreamVideoParticipant,
  VideoDimensionChange,
} from '@stream-io/video-client';
import { Observable, Subscription, tap } from 'rxjs';
import { ParticipantComponent } from '../participant/participant.component';
import { StreamVideoService } from '../stream-video.service';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent
  implements OnInit, AfterViewChecked, OnDestroy, AfterViewInit
{
  call: Call | undefined;
  participants$: Observable<StreamVideoParticipant[]>;
  private subscriptions: Subscription[] = [];
  @ViewChild('participantsContainer')
  private participantsContainer!: ElementRef<HTMLElement>;
  @ViewChildren(ParticipantComponent)
  private particpantComponents: ComponentRef<ParticipantComponent>[] = [];
  private participantsContainerResizeObserver: ResizeObserver | undefined;

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

  ngAfterViewInit(): void {
    console.log(this.participantsContainer);
    this.videoDimensionsChanged();
    this.participantsContainerResizeObserver = new ResizeObserver(() =>
      this.videoDimensionsChanged(),
    );
    this.participantsContainerResizeObserver.observe(
      this.participantsContainer.nativeElement,
    );
  }

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

  private videoDimensionsChanged() {
    const changes: VideoDimensionChange[] = [];
    this.particpantComponents.forEach((component) => {
      console.warn(
        component.instance.participant,
        component.instance.videoDimension,
      );
      changes.push({
        participant: component.instance.participant!,
        videoDimension: component.instance.videoDimension,
      });
    });

    console.warn(changes, this.particpantComponents);
    this.call?.updateVideoDimensions(changes);
  }
}
