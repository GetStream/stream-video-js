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
import { BehaviorSubject, map, Observable, ReplaySubject, take } from 'rxjs';

/**
 * `loading` means that a stream is currently being retrieved from the browser
 * `on` means that there is an ongoing media stream
 * `off` means that the user decided to turn off the stream
 * `error` means an error occurred while trying to retrieve a stream (for example the user didn't give permission to use camera/microphone)
 * `initial` is the default state, which means we didn't try to start a stream yet
 * `disconnected` means the stream is lost due to a device being disconnected/lost
 */
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
  /**
   * The list of available 'audioinput' devices, if devices are added/removed - the list is updated
   * Since some browsers require permissions for listing the devices the list is not initialized by default, you have to call `initAudioDevices` for that in order to have full control over when the permission window will be displayed
   */
  audioDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * The list of available 'videoinput' devices, if devices are added/removed - the list is updated
   * Since some browsers require permissions for listing the devices the list is not initialized by default, you have to call `initVideoDevices` for that in order to have full control over when the permission window will be displayed
   */
  videoDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * The list of available 'audiooutput' devices, if devices are added/removed - the list is updated
   *  Since some browsers require permissions for listing the devices the list is not initialized by default, you have to call `initAudioOutputDevices` for that in order to have full control over when the permission window will be displayed
   */
  audioOutputDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * [Tells if the browser supports audio output change on 'audio' elements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId)
   */
  isAudioOutputChangeSupportedByBrowser = checkIfAudioOutputChangeSupported();
  /**
   * The `deviceId` of the currently selected video input device
   */
  videoDevice$: Observable<string | undefined>;
  /**
   * The `deviceId` of the currently selected audio input device
   */
  audioDevice$: Observable<string | undefined>;
  /**
   * The `deviceId` of the currently selected audio output device
   */
  audioOutputDevice$: Observable<string | undefined>;
  /**
   * Provides detailed information about the video stream, you can use this stream to visaully display the state on the UI
   */
  videoState$: Observable<MediaStreamState>;
  /**
   * If `videoState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  videoErrorMessage$: Observable<string | undefined>;
  /**
   * The video media stream, you can start and stop it with the `startVideo` and `stopVideo` methods
   */
  videoStream$: Observable<MediaStream | undefined>;
  /**
   * Provides detailed information about the audio stream, you can use this stream to visaully display the state on the UI
   */
  audioState$: Observable<MediaStreamState>;
  /**
   * If `audioState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  audioErrorMessage$: Observable<string | undefined>;
  /**
   * The audio media stream, you can start and stop it with the `startAudio` and `stopAudio` methods
   */
  audioStream$: Observable<MediaStream | undefined>;
  /**
   * `true` if there is an audio stream turned on, and detected audio levels suggest that the user is currently speaking
   */
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
  private audioDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private videoDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private audioOutputDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);

  constructor() {
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

    this.audioDevices$ = this.audioDevicesSubject.asObservable();
    this.videoDevices$ = this.videoDevicesSubject.asObservable();
    this.audioOutputDevices$ = this.audioOutputDevicesSubject.asObservable();

    this.audioOutputDevices$
      .pipe(take(1))
      .subscribe((devices) =>
        this.audioOutputDeviceSubject.next(devices[0].deviceId),
      );
  }

  initAudioDevices() {
    getAudioDevices().subscribe(this.audioDevicesSubject);

    watchForDisconnectedAudioDevice(this.audioDevice$).subscribe(() => {
      this.audioStateSubject.next('disconnected');
    });
  }

  initVideoDevices() {
    getVideoDevices().subscribe(this.videoDevicesSubject);

    watchForDisconnectedVideoDevice(this.videoDevice$).subscribe(() => {
      this.videoStateSubject.next('disconnected');
    });
  }

  initAudioOutputDevices() {
    getAudioOutputDevices().subscribe(this.audioOutputDevicesSubject);

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
        this.stopVideo();
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
      });
  }

  stopVideo() {
    if (!this.videoStream) {
      return;
    }
    this.videoStream.getTracks().forEach((t) => t.stop());
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
      });
  }

  stopAudio() {
    if (!this.audioStream) {
      return;
    }
    this.audioStream.getTracks().forEach((t) => t.stop());
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
