import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';

@Component({
  selector: 'app-call-lobby',
  templateUrl: './call-lobby.component.html',
  styleUrls: ['./call-lobby.component.scss'],
})
export class CallLobbyComponent implements OnInit, OnDestroy {
  videoStream?: MediaStream;
  cameraState: 'loading' | 'on' | 'off' | 'error' = 'loading';
  cameraErrorMessage?: string;
  audioStream?: MediaStream;
  audioState: 'loading' | 'on' | 'off' | 'error' = 'loading';
  audioErrorMessage?: string;
  isSpeaking = false;
  constructor(private snackBar: MatSnackBar) {
    getVideoStream()
      .then((s) => {
        this.videoStream = s;
        this.cameraState = 'on';
      })
      .catch((err) => {
        if (err.code === 0) {
          this.cameraErrorMessage = 'Permission denied for camera access';
        } else {
          this.cameraErrorMessage = `Video stream couldn't be started`;
        }
        this.cameraState = 'error';
        this.snackBar.open(this.cameraErrorMessage);
      });
    getAudioStream()
      .then((s) => {
        this.audioStream = s;
        this.audioState = 'on';
        const audioContext = new AudioContext();
        const audioStream = audioContext.createMediaStreamSource(
          this.audioStream,
        );
        const analyser = audioContext.createAnalyser();
        audioStream.connect(analyser);
        analyser.fftSize = 32;

        const frequencyArray = new Uint8Array(analyser.frequencyBinCount);
        setInterval(() => {
          console.log(frequencyArray);
          analyser.getByteFrequencyData(frequencyArray);
          this.isSpeaking = frequencyArray.find((v) => v >= 180) ? true : false;
        }, 100);
      })
      .catch((err) => {
        if (err.code === 0) {
          this.audioErrorMessage = 'Permission denied for camera access';
        } else {
          this.audioErrorMessage = `Video stream couldn't be started`;
        }
        this.audioState = 'error';
        this.snackBar.open(this.audioErrorMessage);
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
}
