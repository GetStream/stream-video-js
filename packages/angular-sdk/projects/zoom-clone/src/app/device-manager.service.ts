import { Injectable } from '@angular/core';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';

export type MediaStreamState = 'loading' | 'on' | 'off' | 'error' | 'initial';

@Injectable({
  providedIn: 'root',
})
export class DeviceManagerService {
  videoState$: Observable<MediaStreamState>;
  videoErrorMessage$: Observable<string | undefined>;
  videoStream$: Observable<MediaStream | undefined>;
  audioState$: Observable<MediaStreamState>;
  audioErrorMessage$: Observable<string | undefined>;
  audioStream$: Observable<MediaStream | undefined>;
  isSpeaking$: Observable<boolean>;
  private videoStateSubject = new BehaviorSubject<MediaStreamState>('initial');
  private videoErrorMessageSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private videoStreamSubject = new BehaviorSubject<MediaStream | undefined>(
    undefined,
  );
  private audioStateSubject = new BehaviorSubject<MediaStreamState>('initial');
  private audioErrorMessageSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private audioStreamSubject = new BehaviorSubject<MediaStream | undefined>(
    undefined,
  );
  private isSpeakingSubject = new BehaviorSubject<boolean>(false);
  private intervalId: any;
  private analyser?: AnalyserNode;

  constructor(private snackBar: MatSnackBar) {
    this.videoState$ = this.videoStateSubject.asObservable();
    this.videoErrorMessage$ = this.videoErrorMessageSubject.asObservable();
    this.videoStream$ = this.videoStreamSubject.asObservable();
    this.audioState$ = this.audioStateSubject.asObservable();
    this.audioErrorMessage$ = this.audioErrorMessageSubject.asObservable();
    this.audioStream$ = this.audioStreamSubject.asObservable();
    this.isSpeaking$ = this.isSpeakingSubject.asObservable();
  }

  get audioState() {
    return this.audioStateSubject.getValue();
  }

  get audioStream() {
    return this.audioStreamSubject.getValue();
  }

  get videoState() {
    return this.videoStateSubject.getValue();
  }

  get videoStream() {
    return this.videoStreamSubject.getValue();
  }

  toggleVideo() {
    if (this.videoState === 'off') {
      this.startVideo();
    } else if (this.videoState === 'on') {
      this.stopVideo();
    }
  }

  toggleAudio() {
    if (this.audioState === 'off') {
      this.startAudio();
    } else if (this.audioState === 'on') {
      this.stopAudio();
    }
  }

  startVideo() {
    getVideoStream()
      .then((s) => {
        this.stopAudio();
        this.videoStreamSubject.next(s);
        this.videoStateSubject.next('on');
      })
      .catch((err) => {
        if (err.code === 0) {
          this.videoErrorMessageSubject.next(
            'Permission denied for camera access',
          );
        } else {
          this.videoErrorMessageSubject.next(
            `Video stream couldn't be started`,
          );
        }
        this.videoStateSubject.next('error');
        this.snackBar.open(this.videoErrorMessageSubject.getValue()!);
      });
  }

  stopVideo() {
    this.videoStream?.getTracks().forEach((t) => t.stop());
    this.videoStreamSubject.next(undefined);
    this.videoStateSubject.next('off');
  }

  startAudio() {
    getAudioStream()
      .then((s) => {
        this.stopAudio();
        this.audioStreamSubject.next(s);
        const audioContext = new AudioContext();
        const audioStream = audioContext.createMediaStreamSource(
          this.audioStream!,
        );
        this.analyser = audioContext.createAnalyser();
        audioStream.connect(this.analyser);
        this.analyser.fftSize = 32;

        const frequencyArray = new Uint8Array(this.analyser.frequencyBinCount);
        setInterval(() => {
          this.analyser?.getByteFrequencyData(frequencyArray);
          this.isSpeakingSubject.next(
            frequencyArray.find((v) => v >= 180) ? true : false,
          );
        }, 100);
        this.audioStateSubject.next('on');
      })
      .catch((err) => {
        if (err.code === 0) {
          this.audioErrorMessageSubject.next(
            'Permission denied for camera access',
          );
        } else {
          this.audioErrorMessageSubject.next(
            `Video stream couldn't be started`,
          );
        }
        this.audioStateSubject.next('error');
        this.snackBar.open(this.audioErrorMessageSubject.getValue()!);
      });
  }

  stopAudio() {
    this.audioStream?.getTracks().forEach((t) => t.stop());
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.analyser?.disconnect();
    this.audioStreamSubject.next(undefined);
    this.audioStateSubject.next('off');
  }
}
