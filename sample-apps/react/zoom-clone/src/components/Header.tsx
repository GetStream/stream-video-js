import { useNavigate } from 'react-router-dom';

import { useObservableValue } from '../hooks';
import { selectedUserSubject } from '../main';

import { SESSION_STORAGE_KEY } from '../utils';

export const Header = () => {
  const user = useObservableValue(selectedUserSubject);
  const navigate = useNavigate();
  return (
    <div className="w-full p-4 bg-zinc-600 text-zinc-50 flex justify-between">
      <span>Stream Zoom clone</span>

      {user && (
        <div className="flex gap-1">
          <span>Signed in as: {user?.name}</span>
          <button
            onClick={() => {
              selectedUserSubject.next(null);
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
              navigate('/user-selection');
            }}
          >
            (leave)
          </button>
        </div>
      )}
    </div>
  );
};
