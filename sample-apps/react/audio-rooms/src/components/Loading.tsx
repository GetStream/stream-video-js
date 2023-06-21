export const LoadingPanel = ({
  message = 'Loading...',
}: {
  message?: string;
}) => {
  return <div className="loading-panel">{message}</div>;
};
