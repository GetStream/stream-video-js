import users from '../../data/users.json';
import { SESSION_STORAGE_USER_KEY } from './constants';
import { getURLCredentials } from './getURLCredentials';
import { User } from '../types/user';
import { getUserFromToken } from './userFromToken';

export const storeUser = (user?: User) => {
  if (!(user && user.id)) return;
  sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(user));
};

export const getSelectedUser = () => {
  const urlCredentials = getURLCredentials();
  const userFromToken = getUserFromToken(urlCredentials.token);

  if (urlCredentials.user_id) {
    return {
      id: urlCredentials.user_id,
      name:
        urlCredentials.user_name ??
        userFromToken?.name ??
        urlCredentials.user_id,
      image: userFromToken?.image,
    };
  } else if (userFromToken?.id) {
    return userFromToken;
  }

  const storedUser = JSON.parse(
    sessionStorage.getItem(SESSION_STORAGE_USER_KEY) || '{}',
  );

  return (
    storedUser.id && users.find((u) => u.id === storedUser.id || undefined)
  );
};
