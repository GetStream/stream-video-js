import { Logout } from '@mui/icons-material';

export const LogoutButton = () => {
  return (
    <button
      className="rmc__button rmc__button--logout"
      onClick={() => window.location.replace(window.location.origin)}
    >
      <Logout />
    </button>
  );
};
