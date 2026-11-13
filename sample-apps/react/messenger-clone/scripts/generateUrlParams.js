const fs = require('node:fs/promises');
const path = require('node:path');
const { createToken } = require('./createToken');

const THIRTY_DAYS_IN_SECONDS = 3600 * 24 * 30;

(async () => {
  const targetUserId = process.argv[2];

  if (!targetUserId) {
    throw new Error('Pass user id string as a first argument to the script');
  }

  const users = JSON.parse(
    await fs.readFile(path.resolve('data', 'users.json'), 'utf-8'),
  );

  const user = users.find((u) => u.id === targetUserId);

  if (!user) {
    throw new Error(
      `Could not find the user with user id ${targetUserId} in data/users.json`,
    );
  }

  const { apiKey, token } = await createToken(user.id, {
    exp: THIRTY_DAYS_IN_SECONDS,
  });

  console.log(
    new URLSearchParams({
      api_key: apiKey,
      user_id: targetUserId,
      user_name: user.name,
      token,
    }).toString(),
  );
})();
