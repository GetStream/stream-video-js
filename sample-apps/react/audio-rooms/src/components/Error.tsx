export const ErrorPanel = ({ error }: { error: Error }) => {
  let message = error.message;
  // @ts-ignore See APIErrorCodes
  if (error.code === 16) {
    message = `Room doesn't exist yet. Please create it first.`;
  }
  return (
    <div className="error-panel">
      <h2>Error</h2>
      {message}
    </div>
  );
};
