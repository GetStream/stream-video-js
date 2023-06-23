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
  return {
    id: characterName,
    name: characterName,
  };
};
