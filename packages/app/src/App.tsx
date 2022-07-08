import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import {
  createClient,
  SelectEdgeServerResponse,
} from '@stream-io/video-client';

const request = {
  callId: 'testroom',
  latencyByEdge: {
    a: {
      measurements: [10, 20],
    },
  },
  userId: 'ol',
};

const useSelectEdgeServerCall = () => {
  const client = React.useMemo(() => {
    return createClient({
      // requests are proxied to http://localhost:26991
      baseUrl: '/',
      sendJson: true,
    });
  }, []);

  const [edgeServersResponse, setEdgeServersResponse] = useState<
    SelectEdgeServerResponse | undefined
  >(undefined);
  useEffect(() => {
    const abort = new AbortController();
    const selectEdgeServer = async () => {
      try {
        const { response } = await client.selectEdgeServer(request, {
          abort: abort.signal,
        });
        setEdgeServersResponse(response);
      } catch (e) {
        console.error(e);
      }
    };

    selectEdgeServer();
    return () => {
      abort.abort();
    };
  }, [client]);
  return edgeServersResponse;
};

const App = () => {
  const edgeServers = useSelectEdgeServerCall();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>SelectEdgeServer RPC response:</p>
        <pre className="App-server-response">
          {JSON.stringify(edgeServers, null, 2)}
        </pre>
      </header>
    </div>
  );
};

export default App;
