import {
  AfterViewChecked,
  Component,
  HostBinding,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Call, StreamVideoLocalParticipant } from '@stream-io/video-client';
import { Observable, Subscription, take } from 'rxjs';
import { DeviceManagerService } from '../device-manager.service';
import { InCallDeviceManagerService } from '../in-call-device-manager.service';
import { StreamVideoService } from '../video.service';

/**
 * The `CallComponent` displays video/audio/screen share streams of participants and call and device controls (start/stop recording, hangup, select camera, mute audio etc.).
 *
 * Based on the `joinCallInstantly` setting of the [call configuration](../core/StreamVideoClient.md#constructor) the component will call the [`joinCall`](../core/StreamVideoClient.md#joincall) method of the `StreamVideoClient` either when an outgoing call is started or when the first callee accepts the call.
 *
 * Selector: `stream-call`
 */
@Component({
  selector: 'stream-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, AfterViewChecked, OnDestroy {
  call?: Call;
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  @HostBinding('class') class = 'str-video__call-angular-host';
  private subscriptions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private inCallDeviceManager: InCallDeviceManagerService,
    private deviceManager: DeviceManagerService,
    private ngZone: NgZone,
  ) {
    this.localParticipant$ = this.streamVideoService.localParticipant$;
    this.inCallDeviceManager.start();
    this.subscriptions.push(
      this.streamVideoService.outgoingCalls$.subscribe((calls) => {
        console.log(
          calls,
          this.streamVideoService.videoClient?.callConfig.joinCallInstantly,
        );
        if (
          calls.length > 0 &&
          this.streamVideoService.videoClient?.callConfig.joinCallInstantly
        ) {
          const outgoingCall = calls[0];
          this.ngZone.runOutsideAngular(() =>
            this.streamVideoService.videoClient?.joinCall({
              id: outgoingCall.call!.id,
              type: outgoingCall.call!.type,
              datacenterId: '',
            }),
          );
        }
      }),
    );
    this.subscriptions.push(
      this.streamVideoService.acceptedCall$.subscribe((call) => {
        if (
          call &&
          !this.streamVideoService.videoClient?.callConfig.joinCallInstantly
        ) {
          this.ngZone.runOutsideAngular(() =>
            this.streamVideoService.videoClient?.joinCall({
              id: call.call!.id,
              type: call.call!.type,
              datacenterId: '',
            }),
          );
        }
      }),
    );
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        this.call = c;
        if (c) {
          this.deviceManager.videoState$.pipe(take(1)).subscribe((s) => {
            if (s === 'initial') {
              this.deviceManager.initVideoDevices();
            }
          });
          this.deviceManager.startVideo();
          this.deviceManager.audioState$.pipe(take(1)).subscribe((s) => {
            if (s === 'initial') {
              this.deviceManager.initAudioDevices();
              this.deviceManager.initAudioOutputDevices();
            }
          });
          this.deviceManager.startAudio();
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
    this.inCallDeviceManager.stop();
  }
}
