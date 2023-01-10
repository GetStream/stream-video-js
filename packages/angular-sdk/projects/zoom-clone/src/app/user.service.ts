import { Injectable } from '@angular/core';
import { UserInput } from '@stream-io/video-client';

export type UserSelectionItem = {
  user: UserInput;
  token: string;
  chatToken: string;
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly users: UserSelectionItem[] = [
    {
      user: {
        id: 'marcelo',
        name: 'marcelo',
        role: 'admin',
        teams: ['team-1, team-2'],
        imageUrl: '',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyY2VsbyJ9.Nhth6nZUqQ6mSz05VAnGGJNRQewpQfqK9reYMYq67NM',
      chatToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyY2Vsb192aWRlbyIsImV4cCI6MTY3NDU2OTU3N30.yhuNmr8k0gORGxVE2TaLxls1sW2S6OMpjZMzMqNbF-E',
    },
    {
      user: {
        id: 'anatoly',
        name: 'anatoly',
        role: 'admin',
        teams: ['team-1, team-2'],
        imageUrl: '',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYW5hdG9seSJ9.wR_ZBBq4izCxlBTgE9eXlNSMEgC0nLqoEIMH-95l4G8',
      chatToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYW5hdG9seV92aWRlbyIsImV4cCI6MTY3NDU2OTYwNX0.mo1S96Lu9FxBjsQKJsV-WP4jOnOnt59jqLz_Z_yGvlg',
    },
    {
      user: {
        id: 'tommaso',
        name: 'tommaso',
        role: 'admin',
        teams: ['team-1, team-2'],
        imageUrl: '',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzbyJ9.p9f9Lp4znTHK73hyFI0JNlxMwUnDU1wJhxjs-UpDg4M',
      chatToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzb192aWRlbyIsImV4cCI6MTY3NDU2OTYzMn0.ooDXd6k-WTFPPnVS6UnjOgVbJPU4fOvnW4s8bewnwNI',
    },
    {
      user: {
        id: 'sam',
        name: 'sam',
        role: 'admin',
        teams: ['team-1, team-2'],
        imageUrl: '',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FtIn0.uX5xmuSRvVwuxjtxcVXxGYLZIVSfwc4yg8etCqrFVYU',
      chatToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FtX3ZpZGVvIiwiZXhwIjoxNjc0NTY5NjU1fQ.tznVaa7tIUkmbEiTAwjqDo-cvA333xnBI_uSzfey4aw',
    },
  ];
  selectedUserId?: string;
}
