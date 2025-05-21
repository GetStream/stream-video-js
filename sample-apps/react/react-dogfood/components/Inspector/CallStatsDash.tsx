import { useCallStateHooks } from '@stream-io/video-react-sdk';

export function CallStatsDash() {
  const { useCallStatsReport } = useCallStateHooks();
  const stats = useCallStatsReport();

  return (
    <div className="rd__inspector-dash rd__inspector-dash_wide">
      <h3 data-copyable data-h>
        Raw call stats (JSON)
      </h3>
      Tip: use _inspector global variable to access client and call instances.
      <pre className="rd__inspector-pre">
        <span data-copy="```json" hidden />
        <span data-copyable>{JSON.stringify(stats, undefined, 2)}</span>
        <span data-copy="```" hidden />
      </pre>
    </div>
  );
}
