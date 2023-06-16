export const ErrorPanel = ({ error }: { error: Error }) => (
  <div className="error-panel">
    <h2>Error</h2>
    {error.message}
  </div>
);
