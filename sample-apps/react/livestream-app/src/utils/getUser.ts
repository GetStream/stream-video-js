import { getURLCredentials } from './getURLCredentials';

// a list of random star-wars characters
export const characters = [
  'Luke Skywalker',
  'C-3PO',
  'R2-D2',
  'Darth Vader',
  'Leia Organa',
  'Han Solo',
  'Chewbacca',
  'Yoda',
  'Obi-Wan Kenobi',
  'Kylo Ren',
  'Bobba Fett',
  'Finn',
];

type UserType = {
  id: string;
  name: string;
};

export const getUser = () => {
  const { user_id, user_name } = getURLCredentials();
  if (user_id) {
    return {
      id: user_id,
      name: user_name ?? user_id,
    };
  }
  const index = Math.floor(Math.random() * characters.length);
  const characterName = characters[index];
  if (!window.sessionStorage.getItem('user')) {
    window.sessionStorage.setItem(
      'user',
      JSON.stringify({
        id: characterName.replace(/[^_\-0-9a-zA-Z@]/g, '_'),
        name: characterName,
      }),
    );
  }
  return JSON.parse(window.sessionStorage.getItem('user') || '{}') as UserType;
};
