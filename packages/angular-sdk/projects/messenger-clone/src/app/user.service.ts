import { Injectable } from '@angular/core';
import { UserInput } from '@stream-io/video-client';

export type UserSelectionItem = {
  user: UserInput;
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
        imageUrl: 'https://randomuser.me/api/portraits/women/47.jpg',
        customJson: new Uint8Array(),
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
        imageUrl: 'https://randomuser.me/api/portraits/men/38.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyayJ9.DQaMyVHfhzy8P6rbdCBzX7PVFsxKlMjQhwT7Du98ikQ',
    },
    {
      user: {
        id: 'bob',
        name: 'bob',
        role: 'user',
        teams: [],
        imageUrl: '',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyayJ9.DQaMyVHfhzy8P6rbdCBzX7PVFsxKlMjQhwT7Du98ikQ',
    },
    {
      user: {
        id: 'jane',
        name: 'Jane',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/women/60.jpg',
        customJson: new Uint8Array(),
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
        imageUrl: 'https://randomuser.me/api/portraits/women/40.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGFtYXJhIn0.txlUfrbc3-WMZiIoJNWu1RfHQTHhBYD3iB6MnJUbMqg',
    },
    {
      user: {
        id: 'john',
        name: 'john',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/men/54.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiam9obiJ9._NBPlzNDacWYmC2hElxcExZEOkGpfP4VhD3WujaTSC4',
    },
  ];
  selectedUserId?: string;
}
