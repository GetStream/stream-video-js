import { Component, Input, OnInit } from '@angular/core';
import {
  StreamVideoParticipant,
  Call,
  SfuModels,
} from '@stream-io/video-client';

@Component({
  selector: 'stream-call-controls',
  templateUrl: './call-controls.component.html',
  styles: [],
})
export class CallControlsComponent implements OnInit {
  @Input() localParticipant?: StreamVideoParticipant;
  @Input() call?: Call;

  TrackKind = SfuModels.TrackKind;

  ngOnInit(): void {}

  updateAudioMuteState() {
    console.warn(
      this.call,
      !this.localParticipant?.publishedTracks.includes(
        SfuModels.TrackKind.AUDIO,
      ),
    );
    this.call?.updateMuteState(
      'audio',
      !!this.localParticipant?.publishedTracks.includes(
        SfuModels.TrackKind.AUDIO,
      ),
    );
  }

  updateVideoMuteState() {
    this.call?.updateMuteState(
      'video',
      !!this.localParticipant?.publishedTracks.includes(
        SfuModels.TrackKind.VIDEO,
      ),
    );
  }

  endCall() {
    this.call?.leave();
  }
}
