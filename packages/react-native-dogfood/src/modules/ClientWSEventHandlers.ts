import { StreamVideoClient } from '@stream-io/video-client';

const watchCallCreatedEvents = (videoClient: StreamVideoClient) => {
  videoClient.on('callCreated', () => {});
};

export { watchCallCreatedEvents };
