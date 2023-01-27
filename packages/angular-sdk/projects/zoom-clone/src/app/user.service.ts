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
        id: 'sara',
        name: 'Sara',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FyYSJ9.Fb8mwRjI7gJDzb3WHL99G8IvWQDep9f1xOF5EnmAHSw',
    },
    {
      user: {
        id: 'michael',
        name: 'Michael',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/men/44.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWljaGFlbCJ9.Lt1sD-9unkZCG7tolF1lB6zsaA4aFFyDRhYNga7iIqU',
    },
    {
      user: {
        id: 'brian',
        name: 'Brian',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYnJpYW4ifQ.-NHbuDYsRDzpy1jX_xCLmUGhvdY2LMbWuiilG27-SsY',
    },
    {
      user: {
        id: 'evelyn',
        name: 'Evelyn',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/women/83.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXZlbHluIn0.jf7UxfRhiBgO2wR7m1pt2sArVLQCgfXl4m1cB3tZ73o',
    },
    {
      user: {
        id: 'tina',
        name: 'Tina',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/women/30.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGluYSJ9.aRgRlBzRIUpteXovHIOoL02JmPPbE8_04rgXQ6_YySI',
    },
    {
      user: {
        id: 'jack',
        name: 'Jack',
        role: 'user',
        teams: [],
        imageUrl: 'https://randomuser.me/api/portraits/men/33.jpg',
        customJson: new Uint8Array(),
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamFjayJ9.parv4tZJixZxt2AcR6iDe-ZZcddGe5IDFilQqgdpghM',
    },
  ];
  selectedUserId?: string;
}
