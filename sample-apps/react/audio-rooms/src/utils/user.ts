import users from '../data/users';
import { SESSION_STORAGE_USER_KEY } from './constants';
import { getURLCredentials } from './getURLCredentials';
import { User } from '../types';

export const storeUser = (user?: User) => {
  if (!(user && user.id)) return;
  sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(user));
};

export const getSelectedUser = () => {
  const urlCredentials = getURLCredentials();
  if (urlCredentials.user_id) {
    return {
      id: urlCredentials.user_id,
      name: urlCredentials.user_name,
    };
  }
  const storedUser = JSON.parse(
    sessionStorage.getItem(SESSION_STORAGE_USER_KEY) || '{}',
  );
  return (
    storedUser.id && users.find((u) => u.id === storedUser.id || undefined)
  );
};
