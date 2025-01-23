import { useCall, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { ValuePoller } from './ValuePoller';
import { ReactNode } from 'react';

export function ConnectivityDash() {
  const client = useStreamVideoClient();
  const call = useCall();

  const getCoordinatorWs = (): WebSocket | undefined =>
    (client?.streamClient.wsConnection as any)?.ws;
  const getSfuWs = (): WebSocket | undefined =>
    (call as any)?.sfuClient?.signalWs;

  const handleDropCoordinatorClick = () => {
    getCoordinatorWs()?.close();
  };

  const handleDropSfuClick = () => {
    getSfuWs()?.close();
  };

  return (
    <div className="rd__inspector-dash">
      <h3 data-copyable data-h>
        Connectivity
      </h3>
      <dl>
        <dt data-copyable data-label>
          Location hint
        </dt>
        <dd data-copyable>
          <ValuePoller
            id="location-hint"
            fetcher={() => client?.streamClient.getLocationHint()}
          />
        </dd>
        <dt data-copyable data-label>
          Edge
        </dt>
        <dd data-copyable>
          <ValuePoller
            id="edge-name"
            fetcher={() =>
              (call as any)?.sfuClient?.credentials?.server?.edge_name
            }
          />
        </dd>
        <dt>
          <span data-copyable data-label>
            Coordinator connection
          </span>
          <button
            className="rd__dash-action-button"
            type="button"
            onClick={handleDropCoordinatorClick}
          >
            Sim. drop
          </button>
        </dt>
        <dd data-copyable>
          <ValuePoller
            id="coordinator-ws-healthy"
            {...getWsConnectionValuePollerProps(getCoordinatorWs)}
          />
        </dd>
        <dt>
          <span data-copyable data-label>
            SFU WebSocket
          </span>
          <button
            className="rd__dash-action-button"
            type="button"
            onClick={handleDropSfuClick}
          >
            Sim. drop
          </button>
        </dt>
        <dd data-copyable>
          <ValuePoller
            id="sfu-ws-healthy"
            {...getWsConnectionValuePollerProps(getSfuWs)}
          />
        </dd>
      </dl>
      <p>
        <small>
          Hint: press "Sim. drop" to force close connection, simulating a
          network drop or a server error.
        </small>
      </p>
    </div>
  );
}

function getWsConnectionValuePollerProps(
  wsGetter: () => WebSocket | undefined,
) {
  const fetcher = () => {
    const readyState = wsGetter()?.readyState;

    if (readyState === undefined) {
      return 'unknown';
    }

    if (readyState === WebSocket.CONNECTING) {
      return 'connecting';
    }

    if (readyState === WebSocket.OPEN) {
      return 'healthy';
    }

    return 'unhealthy';
  };

  const indicator = (value: ReactNode) => (value === 'healthy' ? ' 💚' : ' 💔');
  return { fetcher, indicator };
}
