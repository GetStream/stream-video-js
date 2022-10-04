export const environment = {
  production: true,
  coordinatorUrl: '/rpc',
  wsUrl:
    'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  apiKey: 'key10',
  sfuRpcUrl: 'http://localhost:3031/twirp',
  user: {
    name: 'marcelo',
    role: 'admin',
    teams: ['team-1, team-2'],
    imageUrl: '/profile.png',
    customJson: new Uint8Array(),
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci9tYXJjZWxvIiwiaWF0IjoxNjYzNzc1MjA4LCJ1c2VyX2lkIjoibWFyY2VsbyJ9.1g7cO9RV4f89zeaRXa7ED2WyAKQ6DX3Pj1Qlbt5N8hg',
};
