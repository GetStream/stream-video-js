export const environment = {
  production: true,
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
