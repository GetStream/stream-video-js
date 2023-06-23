import { Avatar, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { roomStates } from '../utils/roomLiveState';
import { useLayoutController, useUserContext } from '../contexts';
import { AddIcon, CloseIcon, HomeIcon, LeaveIcon, ListIcon } from './icons';

export default function Sidebar() {
  const client = useStreamVideoClient();
  const { user, logout } = useUserContext();
  const { showRoomList, toggleShowRoomList, toggleShowCreateRoomModal } =
    useLayoutController();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <section className="sidebar">
        <div className="sidebar-top">
          <div>
            <Avatar name={user?.name || user?.id} imageSrc={user?.imageUrl} />
            <h3>@{user?.name ?? user?.id}</h3>
          </div>
          <button
            className="filled-button filled-button--blue"
            onClick={() => {
              if (!client) return;
              logout(client);
              navigate('/login');
            }}
            title="Log out"
          >
            <LeaveIcon />
            <span>Sign out</span>
          </button>
          {(showRoomList || !location.pathname.match('/join')) && (
            <div className="sidebar-navlinks">
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
                  {liveState}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            className="filled-button filled-button--blue"
            onClick={toggleShowCreateRoomModal}
            title="Create a room"
          >
            <AddIcon />
            <span>Start room</span>
          </button>
          {location.pathname.match(/.*join.*/) && (
            <>
              <button
                className="filled-button filled-button--blue"
                onClick={toggleShowRoomList}
                title={`${showRoomList ? 'Hide' : 'Show'} rooms`}
              >
                {showRoomList ? <CloseIcon /> : <ListIcon />}
                <span>{`${showRoomList ? 'Hide' : 'Show'} rooms`}</span>
              </button>
              <Link
                title="Back to rooms overview"
                className="filled-button filled-button--blue"
                to="/rooms"
              >
                <HomeIcon />
                <span>Rooms</span>
              </Link>
            </>
          )}
        </div>
      </section>
      <div className="header-padding" />
    </>
  );
}
