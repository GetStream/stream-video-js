import { useNavigate } from 'react-router-dom';

import { useObservableValue } from '../hooks';
import { selectedUserSubject } from '../main';

import { SESSION_STORAGE_KEY } from '../utils';

export const Header = () => {
  const user = useObservableValue(selectedUserSubject);
  const navigate = useNavigate();
  return (
    <div className="w-full p-4 bg-zinc-600 text-zinc-50 flex justify-between items-center">
      <span className="py-1">Stream Zoom clone</span>

      {user && (
        <div className="flex gap-2 items-center">
          <span>Signed in as: {user?.name}</span>
          <button
            className="bg-zinc-800 rounded-full flex justify-center items-center text-video-white px-2 py-1"
            onClick={() => {
              selectedUserSubject.next(null);
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
              navigate('/user-selection');
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
