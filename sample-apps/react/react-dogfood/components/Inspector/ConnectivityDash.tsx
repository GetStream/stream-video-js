import { useCall, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { ValuePoller } from './ValuePoller';
import { ReactNode } from 'react';
import { TransportDiagram } from './TransportDiagram';

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
        <dt data-copyable>
          Edge
          <ValuePoller
            id="location-hint"
            as="span"
            fetcher={async () => {
              const locationHint = await client?.streamClient.getLocationHint();
              return <> (location hint: {locationHint})</>;
            }}
          />
        </dt>
        <dd data-copyable>
          <ValuePoller
            id="edge-name"
            fetcher={() =>
              (call as any)?.sfuClient?.credentials?.server?.edge_name
            }
          />
        </dd>
      </dl>
      <section>
        <span data-copy="" hidden />
        <TransportDiagram direction="publisher" />
        <span data-copy="" hidden />
      </section>
      <dl>
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
            SFU connection
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
      <section>
        <small>
          Hint: press "Sim. drop" to force close connection, simulating a
          network drop or a server error.
        </small>
      </section>
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
