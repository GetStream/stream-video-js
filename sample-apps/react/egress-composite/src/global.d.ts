import { Call, StreamVideoClient } from '@stream-io/video-react-sdk';
import { ConfigurationValue } from './ConfigurationContext';

declare global {
  interface Window {
    setupLayout: (configuration: ConfigurationValue) => void;
    call: Call;
    client: StreamVideoClient;
  }
}
