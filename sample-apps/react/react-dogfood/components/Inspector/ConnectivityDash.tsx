import { useCall, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { ValuePoller } from './ValuePoller';

export function ConnectivityDash() {
  const client = useStreamVideoClient();
  const call = useCall();

  return (
    <>
      Connectivity:
      <ul>
        <li>
          Location hint:
          <ValuePoller
            id="location-hint"
            fetcher={() => client?.streamClient.getLocationHint()}
            pollIntervalMs={1000}
          />
        </li>
        <li>
          Coordinator WebSocket:
          <ValuePoller
            id="coordinator-ws-healthy"
            fetcher={() =>
              client?.streamClient.wsConnection?.isHealthy
                ? 'healthy'
                : 'unhealthy'
            }
            pollIntervalMs={1000}
          />
        </li>
        <li>
          SFU WebSocket:
          <ValuePoller
            id="sfu-ws-healthy"
            fetcher={() => {
              const readyState = (call as any)?.sfuClient?.signalWs?.readyState;
              return typeof readyState !== 'undefined'
                ? readyState === WebSocket.OPEN
                  ? 'healthy'
                  : 'unhealthy'
                : undefined;
            }}
            pollIntervalMs={1000}
          />
        </li>
      </ul>
    </>
  );
}
