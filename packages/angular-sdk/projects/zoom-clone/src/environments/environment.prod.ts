export const environment = {
  production: true,
  coordinatorUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
  wsUrl:
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  apiKey: process.env['STREAM_VIDEO_API_KEY'] || 'us83cfwuhy8n',
  chatApiKey: process.env['STREAM_CHAT_API_KEY'] || 'qygw7k5cvvkx',
};
