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
        id: 'sara',
        name: 'Sara',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FyYSJ9.0GJRRAzQAMrh-JmzoUuqqghRMiMO99vkedMurXu3_G4',
    },
    {
      user: {
        id: 'michael',
        name: 'Michael',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/men/44.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWljaGFlbCJ9.zPZGFyD-Q6IwIkQW4FeVgiRZ_0rlBqlTc4UOaOkmGFY',
    },
    {
      user: {
        id: 'brian',
        name: 'Brian',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYnJpYW4ifQ.BWiJ4kdpHA-BKLeIyfWnDkPI8ii52jQ16oF4Gl8chQg',
    },
    {
      user: {
        id: 'evelyn',
        name: 'Evelyn',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/women/83.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXZlbHluIn0.bFgkmtbWcBXEU5erx19uQ0gkYrExMUDv2kfRPCQ9opw',
    },
    {
      user: {
        id: 'tina',
        name: 'Tina',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/women/30.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGluYSJ9.5R-ng_Cgox8F4vuWr65vglo61EzIXLL9oQGHF2yWlf8',
    },
    {
      user: {
        id: 'jack',
        name: 'Jack',
        role: 'user',
        teams: [],
        // imageUrl: 'https://randomuser.me/api/portraits/men/33.jpg',
        // customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamFjayJ9.2B5FavnzrQkARNaruV_8gdqL-lw0h_IUvEyJrV678NM',
    },
  ];
  selectedUserId?: string;
}
