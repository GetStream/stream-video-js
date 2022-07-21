import {StreamVideoClient} from "@stream-io/video-client";

describe('connection',() => {
  const client = new StreamVideoClient('api-key', {
    baseUrl:'/',
    sendJson: true,
    user: {
      userId:'Alice',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.WZkPaUZb84fLkQoEEFw078Xd1RzwR42XjvBISgM2BAk',
    },
  });

  it('should connect', async () => {
    await client.connect();
  })

  it('should disconnect', async () => {
    await client.disconnect();
  })
})
