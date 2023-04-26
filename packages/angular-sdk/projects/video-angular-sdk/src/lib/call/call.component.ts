import {
  AfterViewChecked,
  Component,
  HostBinding,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Call, StreamVideoLocalParticipant } from '@stream-io/video-client';
import { Observable, Subscription } from 'rxjs';
import { DeviceManagerService } from '../device-manager.service';
import { InCallDeviceManagerService } from '../in-call-device-manager.service';
import { StreamVideoService } from '../video.service';

/**
 * The `CallComponent` displays the frame for the call layout, it contains multiple content projection slots where you can inject built-in SDK components or your own custom components to create the call layout.
 *
 * The component contains the following [content projection](https://angular.io/guide/content-projection#content-projection) slots:
 * - `[call-header-start]` which you can use to inject your own content to the beginning of the call header
 * - `[call-header-end]` which you can use to inject your own content to the end of the call header
 * - `[call-header]` which you can use to replace the default call header
 * - `[call-stage]` which you can use to replave the default participant layout
 * - `[call-controls]` which you can use to display the call control buttons
 *
 * If you wish to use the built-in components use this code:
 *
 * ```html
 * <stream-call>
 *  <stream-device-settings call-header-end></stream-device-settings>
 *  <stream-stage call-stage></stream-stage>
 *  <stream-call-controls call-controls></stream-call-controls>
 * </stream-call>
 * ```
 *
 * Based on the `joinCallInstantly` setting of the [call configuration](../core/StreamVideoClient.md#constructor) the component will call the [`joinCall`](../core/StreamVideoClient.md#joincall) method of the `StreamVideoClient` either when an outgoing call is started (`joinCallInstantly` is `true`) or when the first callee accepts the call (`joinCallInstantly` is `false`).
 *
 * The component will start a video and audio stream once a participant joins a call.
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
        if (calls.length > 0) {
          const outgoingCall = calls[0];
          this.ngZone.runOutsideAngular(() =>
            this.streamVideoService.videoClient?.joinCall(
              outgoingCall.call?.id!,
              outgoingCall.call?.type!,
            ),
          );
        }
      }),
    );
    this.subscriptions.push(
      this.streamVideoService.acceptedCall$.subscribe((call) => {
        if (call) {
          this.ngZone.runOutsideAngular(() => {
            const [type, id] = call.call_cid.split(':');
            return this.streamVideoService.videoClient?.joinCall(id, type);
          });
        }
      }),
    );
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe((c) => {
        this.call = c;
        if (c) {
          this.deviceManager.initVideoDevices();
          // this.deviceManager.startVideo();
          this.deviceManager.initAudioDevices();
          // this.deviceManager.startAudio();
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
