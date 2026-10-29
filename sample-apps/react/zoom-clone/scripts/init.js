const { StreamClient } = require('@stream-io/node-sdk');
require('dotenv').config();

const waitFor = (time) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

// added retries as it sometimes fails even if we wait for channel type to be created
const applyGrants = async (
  client,
  { channelType = 'videocall', created = false, retries = 4 } = {},
) => {
  let error = null;

  for (let tries = 0; tries < retries; tries++) {
    console.log('Applying grants, try: ', tries + 1);

    const update = await client.chat
      .getChannelType({ name: channelType })
      .then((existing) =>
        client.chat.updateChannelType({
          name: channelType,
          // required by the update endpoint: keep the type's current values
          automod: existing.automod,
          automod_behavior: existing.automod_behavior,
          max_message_length: existing.max_message_length,
          // the create endpoint doesn't accept these, so set them only on the
          // type this run created
          ...(created ? { quotes: false, reminders: false } : {}),
          grants: {
            user: [
              'add-links',
              'add-links-owner',
              'create-call',
              'create-channel',
              'create-message',
              'create-reaction',
              'delete-attachment-owner',
              'delete-message-owner',
              'delete-reaction-owner',
              'flag-message',
              'join-call',
              'read-channel',
              'read-channel-members',
              'update-message-owner',
              'upload-attachment',
              'upload-attachment-owner',
            ],
          },
        }),
      )
      .catch((e) => {
        return { errorMessage: e.message, errorCode: e.code };
      });

    const lastTry = tries === retries - 1;

    if (!update.errorMessage) break;

    // stop for any other reason than "type videocall does not exist"
    if (update.errorCode !== 16) {
      error = update.errorMessage;
      break;
    }

    // set message and break on last try so we don't wait after
    if (update.errorCode === 16 && lastTry) {
      error = update.errorMessage;
      break;
    }

    await waitFor(1000);
  }

  if (error) throw new Error(error);
};

(async () => {
  const key = process.env.VITE_STREAM_API_KEY;
  const secret = process.env.VITE_STREAM_SECRET;

  const client = new StreamClient(key, secret);

  const created = await client.chat
    .createChannelType({
      name: 'videocall',
      automod: 'disabled',
      automod_behavior: 'flag',
      max_message_length: 5000,
      replies: false,
      custom_events: true,
    })
    .then(() => {
      console.log('Successfully created channel of type "videocall"');
      return true;
    })
    .catch((error) => {
      console.log('Couldn\'t create channel of type "videocall" due to:', {
        error: error.message,
      });
      return false;
    });

  await applyGrants(client, { created })
    .then(() =>
      console.log(
        'Successfully applied grants to role "user" for scope "videocall"',
      ),
    )
    .catch((e) =>
      console.log(
        'Couldn\'t apply grants to role "user" for scope "videocall" due to:',
        {
          error: e.message,
        },
      ),
    );
})();
