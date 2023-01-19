import {
  AfterViewInit,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ChannelFilters } from 'stream-chat';
import {
  ChannelActionsContext,
  ChannelService,
  CustomTemplatesService,
} from 'stream-chat-angular';
import { UserService } from '../user.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, AfterViewInit {
  @ViewChild('channelActions')
  private channelActionsTemplate!: TemplateRef<ChannelActionsContext>;

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private customTemplateService: CustomTemplatesService,
  ) {
    const userId = this.userService.selectedUserId!;

    this.channelService.init({
      members: { $in: [userId] },
      type: 'messaging',
    });
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
}
