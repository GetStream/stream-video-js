import { Injectable } from '@angular/core';
import {
  checkIfAudioOutputChangeSupported,
  getAudioDevices,
  getAudioOutputDevices,
  getAudioStream,
  getVideoDevices,
  getVideoStream,
  watchForDisconnectedAudioDevice,
  watchForDisconnectedAudioOutputDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, map, Observable, take } from 'rxjs';

export type MediaStreamState =
  | 'loading'
  | 'on'
  | 'off'
  | 'error'
  | 'initial'
  | 'disconnected';

@Injectable({
  providedIn: 'root',
})
export class DeviceManagerService {
  audioDevices$ = getAudioDevices();
  videoDevices$ = getVideoDevices();
  audioOutputDevices$ = getAudioOutputDevices();
  isAudioOutputChangeSupportedByBrowser = checkIfAudioOutputChangeSupported();
  videoDevice$: Observable<string | undefined>;
  audioDevice$: Observable<string | undefined>;
  audioOutputDevice$: Observable<string | undefined>;
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
  private audioOutputDeviceSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
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
    this.audioOutputDevice$ = this.audioOutputDeviceSubject.asObservable();

    this.videoDevice$ = this.videoStream$.pipe(
      map((stream) => {
        if (stream) {
          return stream.getVideoTracks()[0].getCapabilities()
            .deviceId as string;
        } else {
          return undefined;
        }
      }),
    );

    this.audioDevice$ = this.audioStream$.pipe(
      map((stream) => {
        if (stream) {
          return stream.getAudioTracks()[0].getCapabilities()
            .deviceId as string;
        } else {
          return undefined;
        }
      }),
    );

    this.audioOutputDevices$
      .pipe(take(1))
      .subscribe((devices) =>
        this.audioOutputDeviceSubject.next(devices[0].deviceId),
      );

    watchForDisconnectedAudioDevice(this.audioDevice$).subscribe(() => {
      this.audioStateSubject.next('disconnected');
    });

    watchForDisconnectedVideoDevice(this.videoDevice$).subscribe(() => {
      this.videoStateSubject.next('disconnected');
    });

    watchForDisconnectedAudioOutputDevice(this.audioOutputDevice$).subscribe(
      () => {
        this.audioOutputDeviceSubject.next(undefined);
      },
    );
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

  startVideo(deviceId?: string) {
    this.videoStateSubject.next('loading');
    getVideoStream(deviceId)
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

  startAudio(deviceId?: string) {
    this.audioStateSubject.next('loading');
    getAudioStream(deviceId)
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
            frequencyArray.find((v) => v >= 150) ? true : false,
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

  selectAudioOutput(deviceId: string | undefined) {
    this.audioOutputDeviceSubject.next(deviceId);
  }
}
