import { Component, OnInit } from '@angular/core';
import { ChannelService } from 'stream-chat-angular';
import { UserService } from '../user.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  constructor(
    private channelService: ChannelService,
    private userService: UserService,
  ) {
    const userId = this.userService.selectedUserId!;

    this.channelService.init({
      members: { $in: [userId] },
      type: 'messaging',
    });
  }

  ngOnInit(): void {}
}
