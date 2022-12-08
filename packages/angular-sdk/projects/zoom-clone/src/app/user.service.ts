import { Injectable } from '@angular/core';
import { UserInput } from '@stream-io/video-client';

export type UserSelectionItem = { user: UserInput; token: string };

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
    },
  ];
  selectedUserId?: string;
}
