import {StreamVideoClient} from "@stream-io/video-client";


describe('Create Call',() => {
  const client = new StreamVideoClient('api-key', {
    baseUrl:'http://localhost:26991',
    sendJson: true,
    user: {
      userId:'Alice',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.WZkPaUZb84fLkQoEEFw078Xd1RzwR42XjvBISgM2BAk',
    },
  });

  it('should connect', async () => {
    await client.connect();
  })

  it('should create call', async () => {

    client.on('callCreated', (call) => {
      console.log(call);
    })

   const createdCall = await client.createCall({
      id:'abc',
      type: 'video',
      participantIds: ['Alice'],
      broadcastOptions: [],
    })
    await client.joinCall({ id:createdCall.id,type: 'video' })
  })
})
