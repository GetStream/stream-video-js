import { CapabilitiesDash } from './CapabiltiesDash';
import { CodecDash } from './CodecDash';
import { ConnectivityDash } from './ConnectivityDash';
import { DevicesDash } from './DevicesDash';
import { InspectorCall } from './InspectorCall';

export default function InspectorPage() {
  return (
    <div className="rd__inspector">
      <CapabilitiesDash />
      <InspectorCall>
        <DevicesDash />
        <ConnectivityDash />
        <CodecDash />
      </InspectorCall>
    </div>
  );
}
