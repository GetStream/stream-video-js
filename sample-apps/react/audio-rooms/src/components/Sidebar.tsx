import { StreamVideoClient, useCalls } from '@stream-io/video-react-sdk';
import { useUserContext } from '../contexts/UserContext';
import { useState } from 'react';
import CreateRoomForm from './CreateRoomForm';
import { Link, useNavigate } from 'react-router-dom';
import { isRoomState, roomStates } from '../utils/roomLiveState';

export default function Sidebar({
  client,
}: {
  client: StreamVideoClient;
}): JSX.Element {
  const { user, logout } = useUserContext();
  const calls = useCalls();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <section className="sidebar">
        <div className="sidebar-top">
          <div>
            <img src={user?.imageUrl} alt={`Profile of ${user?.name}`}></img>
            <h3>@{user?.name}</h3>
          </div>
          <button
            onClick={() => {
              logout(client);
              navigate('/login');
            }}
          >
            Sign out
          </button>
          <div className="sidebar-navlinks">
            <Link to="/rooms">Rooms</Link>
            {roomStates.map((liveState) => (
              <button
                className="nav-button"
                key={`${liveState}-heading-nav-button`}
                onClick={() => {
                  const heading = document.querySelector(
                    `#${liveState}-listing-section`,
                  );
                  if (heading) heading.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {liveState} ({calls.filter(isRoomState[liveState]).length})
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          {/* todo: close modal on click outside */}
          {modalOpen && <CreateRoomForm close={() => setModalOpen(false)} />}
          <button
            onClick={() => {
              setModalOpen((prev) => !prev);
            }}
          >
            + Start room
          </button>
        </div>
      </section>
      <div className="header-padding" />
    </>
  );
}
