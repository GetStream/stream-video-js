import { AfterViewChecked, Component, OnDestroy, OnInit } from '@angular/core';
import {
  Call,
  getAudioStream,
  getVideoStream,
  StreamVideoLocalParticipant,
  watchForDisconnectedAudioDevice,
  watchForDisconnectedVideoDevice,
  checkIfAudioOutputChangeSupported,
  watchForDisconnectedAudioOutputDevice,
} from '@stream-io/video-client';
import { map, Observable, Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, AfterViewChecked, OnDestroy {
  call!: Call;
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  private subscriptions: Subscription[] = [];
  private isAudioOuputDeviceChangeSupported =
    checkIfAudioOutputChangeSupported();

  constructor(private streamVideoService: StreamVideoService) {
    this.localParticipant$ =
      this.streamVideoService.activeCallLocalParticipant$;
    let deviceDisconnectSubscriptions: Subscription[] = [];
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        if (c) {
          this.call = c;
          let audioStream: MediaStream;
          let videoStream: MediaStream;
          try {
            audioStream = await getAudioStream();
          } catch (error) {
            throw error;
          }
          try {
            videoStream = await getVideoStream();
          } catch (error) {
            throw error;
          }
          this.call.publishMediaStreams(audioStream, videoStream);
          deviceDisconnectSubscriptions.push(
            watchForDisconnectedAudioDevice(
              this.localParticipant$.pipe(map((p) => p?.audioDeviceId)),
            ).subscribe(async () => {
              c.updateMuteState('audio', true);
              const audioStream = await getAudioStream();
              c.replaceMediaStream('audioinput', audioStream);
            }),
          );
          deviceDisconnectSubscriptions.push(
            watchForDisconnectedVideoDevice(
              this.localParticipant$.pipe(map((p) => p?.videoDeviceId)),
            ).subscribe(async () => {
              c.updateMuteState('video', true);
              const videoStream = await getVideoStream();
              c.replaceMediaStream('videoinput', videoStream);
            }),
          );
          deviceDisconnectSubscriptions.push(
            watchForDisconnectedAudioOutputDevice(
              this.localParticipant$.pipe(map((p) => p?.audioOutputDeviceId)),
            ).subscribe(async () => {
              c.setAudioOutputDevice(undefined);
            }),
          );
        } else {
          deviceDisconnectSubscriptions.forEach((s) => s.unsubscribe());
          deviceDisconnectSubscriptions = [];
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
}
