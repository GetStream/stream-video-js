import { Props } from './LobbyPanel';

export const KichinSink: Props = {
  joinCall: () => console.log('startCall'),
  logo: '/images/icons/stream-logo.svg',
  user: {
    id: '123213',
    name: 'Kichin Sink',
    role: 'role',
    teams: ['team'],
    image: '',
  },
};
