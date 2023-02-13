import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeviceManagerService } from '../../device-manager.service';
import { MediaStreamState } from '../../types';

/**
 * The `ToggleVideoComponent` displays a button that can be used to mute or unmute your video.
 */
@Component({
  selector: 'stream-toggle-video',
  templateUrl: './toggle-video.component.html',
  styles: [],
})
export class ToggleVideoComponent implements OnInit, OnDestroy {
  videoState?: MediaStreamState;
  private subscriptions: Subscription[] = [];

  constructor(private deviceManager: DeviceManagerService) {
    this.subscriptions.push(
      this.deviceManager.videoState$.subscribe((s) => (this.videoState = s)),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleVideo() {
    this.deviceManager.toggleVideo();
  }
}
