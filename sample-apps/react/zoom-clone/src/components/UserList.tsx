import { useNavigate, useSearchParams } from 'react-router-dom';

import users from '../../data/users.json';

import { selectedUserSubject } from '../main';

import { SESSION_STORAGE_KEY } from '../utils';

export const UserList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const next = decodeURIComponent(searchParams.get('next') ?? '');

  return (
    <div className="justify-center flex w-full h-full">
      <div className="flex flex-col justify-center">
        <h3 className="text-center text-xl">Choose your user:</h3>
        <ul className="self-center justify-self-center w-96 bg-zinc-600 p-4 rounded-xl text-zinc-50">
          {users.map((u) => (
            <li className="p-1 flex flex-col" key={u.id}>
              <button
                className="flex justify-between items-center"
                onClick={() => {
                  selectedUserSubject.next(u);
                  sessionStorage.setItem(SESSION_STORAGE_KEY, u.id);
                  navigate(next.length ? next : '/call-lobby');
                }}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={u.image}
                    alt={u.name}
                    className="h-10 w-10 rounded-full object-contain border- border-2"
                  />
                  <span>{u.name}</span>
                </div>
                <span>{'►'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
