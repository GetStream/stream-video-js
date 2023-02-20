import { useMemo } from 'react';
import {
  StreamMeeting,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';

import { LobbyPanel } from './LobbyPanel';

import * as data from './LobbyPanel.data';

import * as videoData from '../Views/LobbyView/LobbyView.data';

export default {
  component: LobbyPanel,
  subcomponents: {},
  title: 'Lobby/LobbyPanel',
};

export const KichinSink = (props: any) => {
  return <LobbyPanel {...props} />;
};

// export const KichinSink = (props: any) => {
//   const call: {
//     callId: string;
//     currentUser: any;
//     callType: string;
//     input: { members: any; createdBy: any };
//     autoJoin: boolean;
//   } = useMemo(() => {
//     return {
//       callId: `id-${Date.now()}`,
//       callType: 'default',
//       input: {
//         members: [
//           {
//             userId: videoData.KichinSink.user.id,
//             role: videoData.KichinSink.user.role,
//             customJson: videoData.KichinSink.user.customJson,
//           },
//         ],
//         createdBy: videoData.KichinSink.user.id,
//       },

//       currentUser: videoData.KichinSink.user,
//       autoJoin: true,
//     };
//   }, []);

//   const videoStream = useCreateStreamVideoClient({
//     coordinatorRpcUrl: videoData.KichinSink.coordinatorRpcUrl,
//     coordinatorWsUrl: videoData.KichinSink.coordinatorWsUrl,
//     apiKey: videoData.KichinSink.apiKey,
//     token: videoData.KichinSink.token,
//     user: videoData.KichinSink.user,
//   });

//   return (
//     <StreamVideo client={videoStream}>
//       <StreamMeeting
//         callId={call.callId}
//         callType={call.callType}
//         input={call.input}
//         currentUser={call.currentUser}
//       >
//         <LobbyPanel {...props}></LobbyPanel>
//       </StreamMeeting>
//     </StreamVideo>
//   );
// };

// KichinSink.args = {
//   ...data.KichinSink,
// };
