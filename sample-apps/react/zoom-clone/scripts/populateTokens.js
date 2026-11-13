const fs = require('node:fs/promises');
const path = require('node:path');
const { createToken } = require('./createToken');

const THIRTY_DAYS_IN_SECONDS = 3600 * 24 * 30;

(async () => {
  const dataPath = path.resolve('data', 'users.json');
  const users = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

  for (const user of users) {
    const { token } = await createToken(user.id, {
      exp: THIRTY_DAYS_IN_SECONDS,
    });
    user.token = token;
  }

  await fs
    .writeFile(dataPath, JSON.stringify(users, null, 2))
    .then(() => console.log('Generated tokens for "data/users.json"'));
})();
