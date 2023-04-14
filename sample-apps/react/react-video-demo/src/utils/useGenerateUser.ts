import { uniqueNamesGenerator, Config, starWars } from 'unique-names-generator';

const tokenEndpoint: string =
  'https://stream-calls-dogfood.vercel.app/api/auth/create-token';

const config: Config = {
  dictionaries: [starWars],
  separator: '-',
  style: 'lowerCase',
};

export const generateUser = async (role: string, team: string) => {
  const characterName: string = uniqueNamesGenerator(config);

  const userId: string = `demo-${characterName}}`;
  const userName: string = `Demo user ${characterName}`;
  let token: string | undefined;

  try {
    const response = await fetch(
      `${tokenEndpoint}?api_key=${
        import.meta.env.VITE_STREAM_KEY
      }&user_id=${userId}`,
    );
    const data = await response.json();
    token = data.token;
  } catch (error) {
    console.error('Unable to fetch user token');
  }

  return {
    user: {
      id: userId,
      name: userName,
      role: role,
      teams: [team],
      image: '',
      customJson: new Uint8Array(),
    },
    token,
  };
};
