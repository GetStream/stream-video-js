import { Link } from 'react-router-dom';

export const ErrorPanel = ({ error }: { error: Error }) => (
  <div className="error-panel">
    <h2>Error</h2>
    {error.message}
  </div>
);

export const ConnectionErrorPanel = ({ error }: { error: Error }) => (
  <div className="error-panel">
    <h2>Error</h2>
    {error.message}
    <p>
      <Link to="/login">Back to login page</Link>
    </p>
  </div>
);
