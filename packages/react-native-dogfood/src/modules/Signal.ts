import {RTCPeerConnection} from 'react-native-webrtc';
import {RTCDataChannel} from '../../types';
import {SfuEvent} from '../gen/video/sfu/event/events';

export type SignalChannelType = {
  label: string;
  pc: RTCPeerConnection;
  onMessage?: (message: SfuEvent) => void;
};
export const createSignalChannel = ({
  label,
  pc,
  onMessage,
}: SignalChannelType) => {
  const signal = pc.createDataChannel(label) as unknown as RTCDataChannel;

  signal.binaryType = 'arraybuffer';

  signal.addEventListener('open', () => {
    signal.send('ss');
  });

  // @ts-ignore
  signal.addEventListener('message', e => {
    if (!(e.data instanceof ArrayBuffer)) {
      console.error('This socket only accepts exchanging binary data');
      return;
    }

    if (onMessage) {
      const binaryData = new Uint8Array(e.data);
      const message = SfuEvent.fromBinary(binaryData);
      onMessage(message);
    }
  });

  return signal;
};
