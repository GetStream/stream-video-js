import { Injectable, NgZone } from '@angular/core';
import {
  AudioMediaStreamState,
  MediaStreamState,
  ScreenShareState,
} from './types';
import {
  checkIfAudioOutputChangeSupported,
  createSoundDetector,
  getAudioDevices,
  getAudioOutputDevices,
  getAudioStream,
  getScreenShareStream,
  getVideoDevices,
  getVideoStream,
  watchForDisconnectedAudioDevice,
  watchForDisconnectedAudioOutputDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { BehaviorSubject, map, Observable, ReplaySubject, take } from 'rxjs';

/**
 * This service gives a high-level API for listing devices (audio input, video input, and audio output), starting/stopping media streams (including screen share), and switching between devices.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceManagerService {
  /**
   * The list of available `audioinput` devices, if devices are added/removed - the list is updated.
   *
   * Listing the devices requires permission from the user. The list is not initialized by default, you have to call [`initAudioDevices`](#initaudiodevices) to have full control over when the permission window will be displayed.
   */
  audioDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * The list of available `videoinput` devices, if devices are added/removed - the list is updated.
   *
   * Listing the devices requires permission from the user. The list is not initialized by default, you have to call [`initVideoDevices`](#initvideodevices) to have full control over when the permission window will be displayed.
   */
  videoDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * The list of available `audiooutput` devices, if devices are added/removed - the list is updated.
   *
   * Listing the devices requires permission from the user. The list is not initialized by default, you have to call [`initAudioOutputDevices`](#initaudiooutputdevices) to have full control over when the permission window will be displayed.
   */
  audioOutputDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * [Tells if the browser supports audio output change on 'audio' elements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId)
   */
  isAudioOutputChangeSupportedByBrowser = checkIfAudioOutputChangeSupported();
  /**
   * The `deviceId` of the currently selected video input device. If the device is disconnected, the value is set to `undefined`.
   */
  videoDevice$: Observable<string | undefined>;
  /**
   * The `deviceId` of the currently selected audio input device. If the device is disconnected, the value is set to `undefined`.
   */
  audioDevice$: Observable<string | undefined>;
  /**
   * The `deviceId` of the currently selected audio output device. If the device is disconnected, the value is set to `undefined`.
   */
  audioOutputDevice$: Observable<string | undefined>;
  /**
   * Provides detailed information about the video stream, you can use this stream to visually display the state on the UI
   */
  videoState$: Observable<MediaStreamState>;
  /**
   * If `videoState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  videoErrorMessage$: Observable<string | undefined>;
  /**
   * The video media stream, you can start and stop it with the [`startVideo`](#startvideo) and [`stopVideo`](#stopvideo) methods (or [`toggleVideo`](#togglevideo))
   */
  videoStream$: Observable<MediaStream | undefined>;
  /**
   * Provides detailed information about the audio stream, you can use this stream to visually display the state on the UI
   */
  audioState$: Observable<AudioMediaStreamState>;
  /**
   * If `audioState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  audioErrorMessage$: Observable<string | undefined>;
  /**
   * The audio media stream, you can start and stop it with the [`startAudio`](#startaudio) and [`stopAudio`](#stopaudio) methods (or [`toggleAudio`](#toggleaudio))
   */
  audioStream$: Observable<MediaStream | undefined>;
  /**
   * `true` if `audioState$` is `on` or `detecting-speech-while-muted`, and detected audio levels suggest that the user is currently speaking
   */
  isSpeaking$: Observable<boolean>;
  /**
   * Provides detailed information about the screen share stream, you can use this stream to visually display the state on the UI
   */
  screenShareState$: Observable<ScreenShareState>;
  /**
   * If `screenShareState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  screenShareErrorMessage$: Observable<string | undefined>;
  /**
   * The screen share media stream, you can start and stop it with the [`startScreenShare`](#startscreenshare) and [`stopScreenShare`](#stopscreenshare) methods (or [`toggleScreenShare`](#togglescreenshare))
   */
  screenShareStream$: Observable<MediaStream | undefined>;
  private videoStateSubject = new BehaviorSubject<MediaStreamState>('initial');
  private videoErrorMessageSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private videoStreamSubject = new BehaviorSubject<MediaStream | undefined>(
    undefined,
  );
  private audioStateSubject = new BehaviorSubject<AudioMediaStreamState>(
    'initial',
  );
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
  private disposeSoundDetector?: () => Promise<void>;
  private audioDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private videoDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private audioOutputDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private screenShareStateSubject = new BehaviorSubject<ScreenShareState>(
    'initial',
  );
  private screenShareErrorMessageSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private screenShareStreamSubject = new BehaviorSubject<
    MediaStream | undefined
  >(undefined);

  constructor(private ngZone: NgZone) {
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

    this.screenShareState$ = this.screenShareStateSubject.asObservable();
    this.screenShareStream$ = this.screenShareStreamSubject.asObservable();
    this.screenShareErrorMessage$ =
      this.screenShareErrorMessageSubject.asObservable();
  }

  /**
   * Requests permission to use audio devices and initializes the [`audioDevices$`](#audiodevices) list
   */
  initAudioDevices() {
    getAudioDevices().subscribe(this.audioDevicesSubject);

    watchForDisconnectedAudioDevice(this.audioDevice$).subscribe(() => {
      this.audioStateSubject.next('disconnected');
    });
  }

  /**
   * Requests permission to use video devices and initializes the [`videoDevices$`](#videodevices) list
   */
  initVideoDevices() {
    getVideoDevices().subscribe(this.videoDevicesSubject);

    watchForDisconnectedVideoDevice(this.videoDevice$).subscribe(() => {
      this.videoStateSubject.next('disconnected');
    });
  }

  /**
   * Requests permission to use audio devices and initializes the [`audioOutputDevices$`](#audiooutputdevices) list
   */
  initAudioOutputDevices() {
    getAudioOutputDevices().subscribe(this.audioOutputDevicesSubject);

    watchForDisconnectedAudioOutputDevice(this.audioOutputDevice$).subscribe(
      () => {
        this.audioOutputDeviceSubject.next(undefined);
      },
    );
  }

  /**
   * If there is an existing video stream, it will stop that. If not, it will start a new one.
   */
  toggleVideo() {
    if (
      this.videoState === 'off' ||
      this.videoState === 'initial' ||
      this.videoState === 'disconnected'
    ) {
      this.startVideo();
    } else if (this.videoState === 'on') {
      this.stopVideo();
    }
  }

  /**
   * If there is an existing audio stream, it will stop that. If not, it will start a new one.
   */
  toggleAudio() {
    if (
      this.audioState === 'off' ||
      this.audioState === 'initial' ||
      this.audioState === 'disconnected'
    ) {
      this.startAudio();
    } else if (this.audioState === 'on') {
      this.stopAudio();
    } else if (this.audioState === 'detecting-speech-while-muted') {
      this.audioStateSubject.next('on');
    }
  }

  /**
   * If there is an existing screen share stream, it will stop that. If not, it will start a new one.
   */
  toggleScreenShare() {
    if (
      this.screenShareState === 'off' ||
      this.screenShareState === 'initial'
    ) {
      this.startScreenShare();
    } else if (this.screenShareState === 'on') {
      this.stopScreenShare();
    }
  }

  /**
   * Starts a new video stream with the given `deviceId`. If there is an existing stream, the method will take care of the necessary cleanup.
   * @param deviceId if nothing is provided it will use the first available device
   */
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

  /**
   * If there is an existing video stream, it will stop it.
   */
  stopVideo() {
    if (!this.videoStream) {
      return;
    }
    this.videoStream.getTracks().forEach((t) => t.stop());
    this.videoStreamSubject.next(undefined);
    this.videoStateSubject.next('off');
  }

  /**
   *
   * Starts a new audio stream with the given `deviceId`. If there is an existing stream, the method will take care of the necessary cleanup.
   * @param deviceId if nothing is provided it will use the first available device
   * @param isSilent if `true` `audioState$` will be `detecting-speech-while-muted` instead of `on` after stream is started
   */
  startAudio(deviceId?: string, isSilent = false) {
    this.audioStateSubject.next('loading');
    getAudioStream(deviceId)
      .then((audioStream) => {
        this.stopAudio();
        this.audioStreamSubject.next(audioStream);
        this.disposeSoundDetector = this.ngZone.runOutsideAngular(() => {
          return createSoundDetector(audioStream, (isSpeechDetected) => {
            if (isSpeechDetected !== this.isSpeakingSubject.getValue()) {
              this.ngZone.run(() => {
                this.isSpeakingSubject.next(isSpeechDetected);
              });
            }
          });
        });
        this.audioStateSubject.next(
          isSilent ? 'detecting-speech-while-muted' : 'on',
        );
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

  /**
   * If there is an existing audio stream, it will stop it.
   */
  stopAudio() {
    if (!this.audioStream) {
      return;
    }
    this.audioStream.getTracks().forEach((t) => t.stop());
    this.disposeSoundDetector?.();
    this.audioStreamSubject.next(undefined);
    this.audioStateSubject.next('off');
  }

  /**
   * Prompts the user for permission to share a screen and starts the stream if the user granted permission. If there is an existing stream, the method will take care of the necessary cleanup.
   */
  startScreenShare() {
    this.screenShareStateSubject.next('loading');
    getScreenShareStream()
      .then((s) => {
        this.stopScreenShare();
        s.getVideoTracks().forEach((t) => {
          t.addEventListener('ended', () => {
            this.stopScreenShare();
          });
        });
        this.screenShareStreamSubject.next(s);
        this.screenShareStateSubject.next('on');
      })
      .catch(() => {
        this.screenShareErrorMessageSubject.next(
          `Screen share stream couldn't be started`,
        );
        this.screenShareStateSubject.next('off');
      });
  }

  /**
   * If there is an existing screen share stream, it will stop it.
   */
  stopScreenShare() {
    if (!this.screenShareStream) {
      return;
    }
    this.screenShareStream.getTracks().forEach((t) => t.stop());
    this.screenShareStreamSubject.next(undefined);
    this.screenShareStateSubject.next('off');
  }

  /**
   * Sets [`audioOutputDevice$`](#audiooutputdevice). Selecting an audio output device only makes sense if the [browser supports changing audio output on 'audio' elements](#isaudiooutputchangesupportedbybrowser)
   * @param deviceId
   */
  selectAudioOutput(deviceId: string | undefined) {
    this.audioOutputDeviceSubject.next(deviceId);
  }

  private get audioState() {
    return this.audioStateSubject.getValue();
  }

  private get audioStream() {
    return this.audioStreamSubject.getValue();
  }

  private get videoState() {
    return this.videoStateSubject.getValue();
  }

  private get videoStream() {
    return this.videoStreamSubject.getValue();
  }

  private get screenShareState() {
    return this.screenShareStateSubject.getValue();
  }

  private get screenShareStream() {
    return this.screenShareStreamSubject.getValue();
  }
}
