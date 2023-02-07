import { Injectable } from '@angular/core';
import { User } from '@stream-io/video-client';

export type UserSelectionItem = {
  user: User;
  token: string;
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly users: UserSelectionItem[] = [
    {
      user: {
        id: 'alice',
        name: 'Alice',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/women/47.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.CH6hztnxZXun4Qh0wnQQtnBW0sbbGNHnZJ6Z9s8JfQY',
    },
    {
      user: {
        id: 'mark',
        name: 'Mark',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/men/38.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyayJ9.DQaMyVHfhzy8P6rbdCBzX7PVFsxKlMjQhwT7Du98ikQ',
    },
    {
      user: {
        id: 'bob',
        name: 'Bob',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/men/42.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYm9iIn0.A1YC1qSR7Fb_fNHQK2QMpdOHbsk_jaRrIu22fNe0ITE',
    },
    {
      user: {
        id: 'jane',
        name: 'Jane',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/women/60.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamFuZSJ9.YFE47Q-63Go_fiiZTfJTvQ7q62r-Ek-YdbM4mP9Ybuc',
    },
    {
      user: {
        id: 'tamara',
        name: 'Tamara',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/women/40.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGFtYXJhIn0.txlUfrbc3-WMZiIoJNWu1RfHQTHhBYD3iB6MnJUbMqg',
    },
    {
      user: {
        id: 'john',
        name: 'John',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/men/54.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiam9obiJ9._NBPlzNDacWYmC2hElxcExZEOkGpfP4VhD3WujaTSC4',
    },
  ];
  selectedUserId?: string;
}
