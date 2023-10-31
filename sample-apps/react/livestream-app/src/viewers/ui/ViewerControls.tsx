import { useNavigate } from 'react-router-dom';
import { LeaveBadge } from '../../components';

import './ViewerControls.scss';
import { useCall } from '@stream-io/video-react-sdk';

export const ViewerControls = () => {
  const call = useCall();
  const navigate = useNavigate();

  const onClickHandler = async () => {
    await call?.leave();
    navigate('/');
  };

  return (
    <div className="viewer-controls">
      <button
        className="viewer-control-button"
        type="button"
        onClick={onClickHandler}
      >
        <LeaveBadge />
        <span>Leave Stream</span>
      </button>
    </div>
  );
};
