import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  StreamVideoParticipant,
  Call,
  SfuModels,
} from '@stream-io/video-client';
import { NgxPopperjsTriggers } from 'ngx-popperjs';
import { Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call-controls',
  templateUrl: './call-controls.component.html',
  styles: [],
})
export class CallControlsComponent implements OnInit, OnDestroy {
  localParticipant?: StreamVideoParticipant;
  call?: Call;
  isCallRecordingInProgress: boolean = false;
  popperTrigger = NgxPopperjsTriggers.click;
  private subscriptions: Subscription[] = [];

  TrackType = SfuModels.TrackType;

  constructor(private streamVideoService: StreamVideoService) {
    this.subscriptions.push(
      this.streamVideoService.callRecordingInProgress$.subscribe(
        (inProgress) => (this.isCallRecordingInProgress = inProgress),
      ),
    );
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => (this.call = c)),
    );
    this.subscriptions.push(
      this.streamVideoService.activeCallLocalParticipant$.subscribe(
        (p) => (this.localParticipant = p),
      ),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  updateAudioMuteState() {
    console.warn(
      this.call,
      !this.localParticipant?.publishedTracks.includes(
        SfuModels.TrackType.AUDIO,
      ),
    );
    this.call?.updateMuteState(
      'audio',
      !!this.localParticipant?.publishedTracks.includes(
        SfuModels.TrackType.AUDIO,
      ),
    );
  }

  updateVideoMuteState() {
    this.call?.updateMuteState(
      'video',
      !!this.localParticipant?.publishedTracks.includes(
        SfuModels.TrackType.VIDEO,
      ),
    );
  }

  toggleRecording() {
    alert('Not yet implemented');
    // TODO: call meta should be part of the store
    // this.isCallRecordingInProgress
    //   ? this.streamVideoService.videoClient?.stopRecording('', '')
    //   : this.streamVideoService.videoClient?.startRecording('', '');
  }

  endCall() {
    this.call?.leave();
  }
}
