const { StreamChat } = require('stream-chat');
const fs = require('node:fs/promises');
const path = require('node:path');

require('dotenv').config();

(async () => {
  const key = process.env.VITE_STREAM_KEY;
  const secret = process.env.VITE_STREAM_SECRET;

  const users = JSON.parse(
    await fs.readFile(path.resolve('data', 'users.json'), 'utf-8'),
  );

  const usersWithoutToken = users.map(({ token: _, ...rest }) => rest);

  const client = new StreamChat(key, secret);

  console.log('Creating users...');
  await client.upsertUsers(usersWithoutToken);

  const channels = usersWithoutToken
    .flatMap((user, index) =>
      usersWithoutToken.map((nestedUser, nestedIndex) => {
        if (index >= nestedIndex) return null;
        return [user, nestedUser];
      }),
    )
    .filter(Boolean)
    .map(([firstUser, secondUser]) =>
      client.channel('messaging', {
        members: [firstUser.id, secondUser.id],
        created_by: firstUser,
      }),
    );

  console.log('Initiating channels between two users...');

  await Promise.allSettled(channels.map((c) => c.create()));

  console.log('Finished initialization');
})();
