import {
  LoadingIndicator,
  StreamCall,
  StreamTheme,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import '@stream-io/video-react-shared/styles.scss';

import { useConfiguration } from './context/ConfigurationContext';
import { useInitializeVideoClient, useInitializeCall } from './hooks';
import { CallUI } from './components/CallUI';

const App = () => {
  const {
    apiKey,
    token,
    userId,
    userName,
    userImage,
    userType,
    callType,
    callId,
    skipLobby,
    theme,
  } = useConfiguration();

  const client = useInitializeVideoClient({
    apiKey,
    userType,
    userId,
    userName,
    userImage,
    token,
  });

  const call = useInitializeCall({
    client,
    callType,
    callId,
  });

  if (!client || !call) {
    return (
      <StreamTheme style={theme}>
        <div className="str-video__call">
          <div className="str-video__call__loading-screen">
            <LoadingIndicator />
          </div>
        </div>
      </StreamTheme>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme style={theme}>
          <CallUI callType={callType} skipLobby={skipLobby} />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
};

export default App;
