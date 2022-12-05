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
  ];
  selectedUserId?: string;

  constructor() {}
}
