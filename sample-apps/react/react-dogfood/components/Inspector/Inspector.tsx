import { CallStatsDash } from './CallStatsDash';
import { CapabilitiesDash } from './CapabiltiesDash';
import { CodecDash } from './CodecDash';
import { ConnectivityDash } from './ConnectivityDash';
import { DevicesDash } from './DevicesDash';
import { InspectorCall } from './InspectorCall';

export interface InspectorProps {
  autoJoinDemoCall?: boolean;
}

export default function Inspector(props: InspectorProps) {
  return (
    <div className="rd__inspector">
      <InspectorCall {...props}>
        {(client, call) => (
          <div className="rd__inspector-dashes">
            <CapabilitiesDash />
            <DevicesDash />
            {call && <ConnectivityDash />}
            {call && <CodecDash />}
            {call && <CallStatsDash />}
          </div>
        )}
      </InspectorCall>
    </div>
  );
}
