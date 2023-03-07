import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeviceManagerService } from '../../device-manager.service';
import { ScreenShareState } from '../../types';

/**
 * The `ToggleScreenshareComponent` displays a button which can be used to start or stop screen share.
 */
@Component({
  selector: 'stream-toggle-screenshare',
  templateUrl: './toggle-screenshare.component.html',
  styles: [],
})
export class ToggleScreenshareComponent implements OnInit, OnDestroy {
  screenShareState?: ScreenShareState;
  private subscriptions: Subscription[] = [];

  constructor(private deviceManager: DeviceManagerService) {
    this.subscriptions.push(
      this.deviceManager.screenShareState$.subscribe(
        (s) => (this.screenShareState = s),
      ),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleScreenShare() {
    this.deviceManager.toggleScreenShare();
  }
}
