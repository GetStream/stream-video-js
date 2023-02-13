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
        // image: 'https://randomuser.me/api/portraits/women/47.jpg',
      },
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.kLKyVZ26PtAU7SQ0CSL7f1eIAlZtp8Yqo41QKkRCp9U',
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
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyayJ9.X71Mg8lxM05jyJGJI2o79s-z6BhGCzXA0WuqIn692bQ',
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
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYm9iIn0.UkoCSUECkrS1lH2GzIjnFn82ECRb4Rsokx3s3uwXq8Q',
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
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamFuZSJ9.sSrJUT3D-KMOPVwP7ervXhMCjB_0ReRPx2qLDogd6RM',
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
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGFtYXJhIn0.Te7bmHVH2huyhTYna5J8yWPEZcPFOUEjLoQtFZy0OTw',
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
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiam9obiJ9.wvR6O44Bl08E3C-vXCkcWHGPK0oAFIK4yRUySwT_eHs',
    },
  ];
  selectedUserId?: string;
}
