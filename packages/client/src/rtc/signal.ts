import { SfuEvent } from '../gen/video/sfu/event/events';

export type SignalChannelOpts = {
  label: string;
  pc: RTCPeerConnection;
  onMessage?: (message: SfuEvent) => void;
};
export const createSignalChannel = ({
  label,
  pc,
  onMessage,
}: SignalChannelOpts) => {
  const signal = pc.createDataChannel(label);
  signal.binaryType = 'arraybuffer';

  signal.addEventListener('open', () => {
    signal.send('ss');
  });

  signal.addEventListener('message', (e) => {
    if (!(e.data instanceof ArrayBuffer)) {
      console.error(`This socket only accepts exchanging binary data`);
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
