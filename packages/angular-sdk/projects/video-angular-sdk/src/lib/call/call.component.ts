import {
  AfterViewChecked,
  Component,
  HostBinding,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Call, StreamVideoLocalParticipant } from '@stream-io/video-client';
import { Observable, Subscription } from 'rxjs';
import { DeviceManagerService } from '../device-manager.service';
import { InCallDeviceManagerService } from '../in-call-device-manager.service';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, AfterViewChecked, OnDestroy {
  call!: Call;
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  @HostBinding('class') class = 'str-video__call-angular-host';
  private subscriptions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private inCallDeviceManager: InCallDeviceManagerService,
    private deviceManager: DeviceManagerService,
  ) {
    this.deviceManager.initAudioDevices();
    this.deviceManager.initVideoDevices();
    this.deviceManager.initAudioOutputDevices();
    this.deviceManager.startAudio();
    this.deviceManager.startVideo();
    this.localParticipant$ = this.streamVideoService.localParticipant$;
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(async (c) => {
        this.call = c!;
        if (c) {
          this.inCallDeviceManager.start();
        } else {
          this.inCallDeviceManager.stop();
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
