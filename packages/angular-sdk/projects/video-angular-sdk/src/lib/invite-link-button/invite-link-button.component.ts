import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Call } from '@stream-io/video-client';
import { Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';

/**
 * The `InviteLinkButtonComponent` displays a button that users can use the copy the invite link of the active call. If there is no active call the component displays nothing.
 *
 * You can override the link format in the [`StreamVideoService`](../core/StreamVideoService.md).
 */
@Component({
  selector: 'stream-invite-link-button',
  templateUrl: './invite-link-button.component.html',
  styles: [],
})
export class InviteLinkButtonComponent implements OnInit, OnDestroy {
  activeCall?: Call;
  inviteLinkTooltipText?: string;
  private subscriptions: Subscription[] = [];

  constructor(private streamVideoService: StreamVideoService) {
    this.subscriptions.push(
      this.streamVideoService.activeCall$.subscribe(
        (c) => (this.activeCall = c),
      ),
    );
  }

  @HostBinding('style')
  get style() {
    return this.activeCall ? {} : { display: 'none' };
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  async getInviteLink() {
    if (!this.activeCall) {
      return;
    }
    try {
      await this.streamVideoService.copyInviteLink(
        this.activeCall.data!.call!.id,
      );
      this.inviteLinkTooltipText = 'Invite link copied to clipboard';
      setTimeout(() => (this.inviteLinkTooltipText = undefined), 1500);
    } catch (err) {
      this.inviteLinkTooltipText = 'Invite link copy failed';
      setTimeout(() => (this.inviteLinkTooltipText = undefined), 1500);
    }
  }
}
