import { Config, starWars, uniqueNamesGenerator } from 'unique-names-generator';
import { v1 as uuid } from 'uuid';
import { getURLCredentials } from './getURLCredentials';

export type User = {
  id: string;
  name: string;
  role: string;
  teams: string[];
  image?: string;
};

const config: Config = {
  dictionaries: [starWars],
  separator: '-',
  style: 'capital',
};

export const generateUser = (): User => {
  const { user_id, user_name, id } = getURLCredentials();
  const characterName: string = uniqueNamesGenerator(config);

  const userName: string = user_name ?? `${characterName}`;
  const userId: string = user_id ?? `demo-${userName}-${uuid()}`;

  return {
    id: userId,
    name: userName,
    role: id ? 'user' : 'admin',
    teams: ['@stream-io/video-demo'],
  };
};
