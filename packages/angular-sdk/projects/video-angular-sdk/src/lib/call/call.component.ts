import {
  AfterViewChecked,
  Component,
  HostBinding,
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
  ) {
    this.localParticipant$ = this.streamVideoService.localParticipant$;
    this.inCallDeviceManager.start();
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        this.call = c;
        if (c) {
          this.deviceManager.videoState$.pipe(take(1)).subscribe((s) => {
            if (s === 'initial') {
              this.deviceManager.initVideoDevices();
              this.deviceManager.startVideo();
            }
          });
          this.deviceManager.audioState$.pipe(take(1)).subscribe((s) => {
            if (s === 'initial') {
              this.deviceManager.initAudioDevices();
              this.deviceManager.initAudioOutputDevices();
              this.deviceManager.startAudio();
            }
          });
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
