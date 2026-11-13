const fs = require('node:fs/promises');
const path = require('node:path');
const { StreamChat } = require('stream-chat');
const { createToken } = require('./createToken');

const connect = async ({ token: _, ...user }) => {
  const { apiKey, token } = await createToken(user.id);
  const client = new StreamChat(apiKey);
  await client.connectUser(user, token);
  return client;
};

(async () => {
  const users = JSON.parse(
    await fs.readFile(path.resolve('data', 'users.json'), 'utf-8'),
  );

  console.log('Creating users...');
  for (const user of users) {
    const client = await connect(user);
    await client.disconnectUser();
  }

  console.log('Initiating channels between two users...');
  for (const [index, user] of users.entries()) {
    const others = users.slice(index + 1);
    if (!others.length) continue;
    const client = await connect(user);
    const results = await Promise.allSettled(
      others.map((other) =>
        client
          .channel('messaging', {
            members: [{ user_id: user.id }, { user_id: other.id }],
          })
          .create(),
      ),
    );
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `Failed to create the channel ${user.id} <> ${others[i].id}`,
          result.reason,
        );
      }
    });
    await client.disconnectUser();
  }

  console.log('Finished initialization');
})();
