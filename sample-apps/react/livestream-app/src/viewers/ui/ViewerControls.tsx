import { Link } from 'react-router-dom';
import { LeaveBadge } from '../../components';

import './ViewerControls.scss';

export const ViewerControls = () => {
  return (
    <div className="viewer-controls">
      <Link to="/">
        <button className="viewer-control-button" type="button">
          <LeaveBadge />
          <span>Leave Stream</span>
        </button>
      </Link>
    </div>
  );
};
