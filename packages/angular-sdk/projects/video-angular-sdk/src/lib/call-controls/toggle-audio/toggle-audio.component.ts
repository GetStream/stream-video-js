import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeviceManagerService } from '../../device-manager.service';
import { AudioMediaStreamState } from '../../types';

/**
 * The `ToggleAudioComponent` displays a button that can be used to mute or unmute your audio.
 */
@Component({
  selector: 'stream-toggle-audio',
  templateUrl: './toggle-audio.component.html',
  styles: [],
})
export class ToggleAudioComponent implements OnInit, OnDestroy {
  audioState?: AudioMediaStreamState;
  private subscriptions: Subscription[] = [];

  constructor(private deviceManager: DeviceManagerService) {
    this.subscriptions.push(
      this.deviceManager.audioState$.subscribe((s) => (this.audioState = s)),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleAudio() {
    this.deviceManager.toggleAudio();
  }
}
