// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  coordinatorUrl: '/rpc',
  wsUrl:
    'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  apiKey: 'us83cfwuhy8n',
  sfuRpcUrl: 'http://localhost:3031/twirp',
  user: {
    name: 'marcelo',
    role: 'admin',
    teams: ['team-1, team-2'],
    imageUrl: '/profile.png',
    customJson: new Uint8Array(),
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyY2VsbyJ9.Nhth6nZUqQ6mSz05VAnGGJNRQewpQfqK9reYMYq67NM',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
