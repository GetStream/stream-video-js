import { uniqueNamesGenerator, Config, starWars } from 'unique-names-generator';
import { v1 as uuid } from 'uuid';

const tokenEndpoint: string =
  'https://stream-calls-dogfood.vercel.app/api/auth/create-token';

const config: Config = {
  dictionaries: [starWars],
  separator: '-',
  style: 'capital',
};

export const generateUser = async (role: string, team: string) => {
  const characterName: string = uniqueNamesGenerator(config);

  const userId: string = `demo-${uuid()}`;
  const userName: string = `${characterName}`;
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
