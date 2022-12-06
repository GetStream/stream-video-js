import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  DeviceManagerService,
  MediaStreamState,
} from '../device-manager.service';

@Component({
  selector: 'app-device-control',
  templateUrl: './device-control.component.html',
  styleUrls: ['./device-control.component.scss'],
})
export class DeviceControlComponent implements OnInit, OnDestroy {
  videoState?: MediaStreamState;
  audioState?: MediaStreamState;
  private subscriptions: Subscription[] = [];

  constructor(private deviceManager: DeviceManagerService) {
    this.subscriptions.push(
      this.deviceManager.videoState$.subscribe((s) => (this.videoState = s)),
    );
    this.subscriptions.push(
      this.deviceManager.audioState$.subscribe((s) => (this.audioState = s)),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleAudio() {
    this.deviceManager.toggleAudio();
  }

  toggleVideo() {
    this.deviceManager.toggleVideo();
  }

  ngOnInit(): void {}
}
