import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  Call,
  StreamVideoParticipant,
  SubscriptionChange,
} from '@stream-io/video-client';
import { debounceTime, Observable, Subject, Subscription } from 'rxjs';
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
  call!: Call;
  participants$: Observable<StreamVideoParticipant[]>;
  private subscriptions: Subscription[] = [];
  @ViewChild('participantsContainer')
  private participantsContainer!: ElementRef<HTMLElement>;
  @ViewChildren(ParticipantComponent)
  private particpantComponents: ParticipantComponent[] = [];
  private participantsContainerResizeObserver: ResizeObserver | undefined;
  private videoDimensionsSubject = new Subject<SubscriptionChange[]>();

  constructor(private streamVideoService: StreamVideoService) {
    this.participants$ = this.streamVideoService.activeCallParticipants$;
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        this.call = c!;
        const ownMediaStream = await this.getOwnMediaStream();
        this.call.publish(ownMediaStream, ownMediaStream);
      }),
    );
    this.videoDimensionsSubject
      .pipe(debounceTime(1200))
      .subscribe((changes) => this.call.updateSubscriptionsPartial(changes));
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
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
    const changes: SubscriptionChange[] = [];
    this.particpantComponents.forEach((component) => {
      changes.push({
        participant: component.participant!,
        videoDimension: component.videoDimension,
      });
    });

    this.videoDimensionsSubject.next(changes);
  }
}
