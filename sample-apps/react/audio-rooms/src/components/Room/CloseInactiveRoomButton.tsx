import { ChildrenOnly } from '@stream-io/video-react-sdk';
import { useNavigate } from 'react-router-dom';

export const CloseInactiveRoomButton = ({ children }: ChildrenOnly) => {
  const navigate = useNavigate();
  return (
    <button className="leave-button" onClick={async () => navigate('/rooms')}>
      {children}
    </button>
  );
};
