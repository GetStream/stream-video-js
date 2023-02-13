import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { Channel, ChannelFilters } from 'stream-chat';
import {
  ChannelActionsContext,
  ChannelService,
  CustomTemplatesService,
} from 'stream-chat-angular';
import { UserService } from '../user.service';
import { v4 as uuidv4 } from 'uuid';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { OutgoingCallComponent } from '../outgoing-call/outgoing-call.component';
import { MemberRequest } from '@stream-io/video-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {
  isCallCreationInProgress = false;
  inCall = false;
  @ViewChild('channelActions')
  private channelActionsTemplate!: TemplateRef<ChannelActionsContext>;
  private subscripitions: Subscription[] = [];
  private dialogRef?: MatDialogRef<any>;

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private customTemplateService: CustomTemplatesService,
    private videoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
    const userId = this.userService.selectedUserId!;

    this.channelService.init({
      members: { $in: [userId] },
      type: 'messaging',
    });

    this.subscripitions.push(
      this.videoService.activeCall$.subscribe((c) => (this.inCall = !!c)),
    );
  }

  userSelected(selectedUserId?: string) {
    const userId = this.userService.selectedUserId!;
    let filterOption: ChannelFilters = {
      $and: [{ members: { $in: [userId] } }, { type: 'messaging' }],
    };
    if (selectedUserId) {
      filterOption.$and?.push({ members: { $in: [selectedUserId] } });
    }

    this.channelService.reset();
    this.channelService.init(filterOption);
  }

  ngAfterViewInit(): void {
    this.customTemplateService.channelActionsTemplate$.next(
      this.channelActionsTemplate,
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscripitions.forEach((s) => s.unsubscribe());
    this.dialogRef?.close();
  }

  async startCallInChannel(channel: Channel) {
    this.isCallCreationInProgress = true;

    const members = Object.keys(channel.state?.members)
      ?.map((userId) =>
        this.userService.users.find((u) => u.user.id === userId),
      )
      .filter((m) => !!m);
    const memberInput: MemberRequest[] = (members || []).map<MemberRequest>(
      (m) => ({
        user: {
          id: m!.user.id,
        },
      }),
    );
    try {
      const call = await this.videoService.videoClient?.getOrCreateCall(
        uuidv4(),
        'default',
        {
          ring: true,
          data: {
            members: memberInput,
            custom: {
              channelId: channel.id,
            },
          },
        },
      );
      if (call) {
        this.dialog.open(OutgoingCallComponent, {
          disableClose: true,
          data: call,
        });
      }
      this.isCallCreationInProgress = false;
    } catch (error: any) {
      console.error(error);
      this.snackBar.open(`Call couldn't be started, ${error.message}`);
      this.isCallCreationInProgress = false;
    }
  }
}
