import { SfuEvent } from '../gen/video/sfu/event/events';

// export type SignalChannelOpts = {
//   label: string;
//   pc: RTCPeerConnection;
//   onMessage?: (message: SfuEvent) => void;
// };
// export const createSignalChannel = ({
//   label,
//   pc,
//   onMessage,
// }: SignalChannelOpts) => {
//   const signal = pc.createDataChannel(label);
//   signal.binaryType = 'arraybuffer';
//
//   signal.addEventListener('open', () => {
//     signal.send('ss');
//   });
//
//   signal.addEventListener('message', (e) => {
//     if (!(e.data instanceof ArrayBuffer)) {
//       console.error(`This socket only accepts exchanging binary data`);
//       return;
//     }
//
//     if (onMessage) {
//       const binaryData = new Uint8Array(e.data);
//       const message = SfuEvent.fromBinary(binaryData);
//       onMessage(message);
//     }
//   });
//
//   return signal;
// };

export const createWebSocketSignalChannel = (opts: {
  endpoint: string;
  onMessage?: (message: SfuEvent) => void;
}) => {
  return new Promise<WebSocket>((resolve) => {
    const { endpoint, onMessage } = opts;
    const ws = new WebSocket(endpoint);
    ws.binaryType = 'arraybuffer'; // do we need this?
    ws.addEventListener('open', () => {
      // ws.send('ss');
      return resolve(ws);
    });

    ws.addEventListener('error', (e) => {
      console.error('Error', e);
    });

    ws.addEventListener('close', (e) => {
      console.warn('Signalling channel is closed', e);
    });

    if (onMessage) {
      ws.addEventListener('message', (e) => {
        const message =
          e.data instanceof ArrayBuffer
            ? SfuEvent.fromBinary(new Uint8Array(e.data))
            : SfuEvent.fromJsonString(e.data);

        onMessage(message);
      });
    }
  });
};
