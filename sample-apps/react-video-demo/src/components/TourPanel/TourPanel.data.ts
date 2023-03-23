import { Props } from './TourPanel';

export const KichinSink: Props = {
  header: 'Check Call Quality & Statistics',
  explanation:
    'View monitored call metrics such as latency, jitter, and packet loss in real-time for in-depth performance insights.',
  current: 1,
  total: 3,
  close: () => {
    console.log('close');
  },
  next: () => {
    console.log('next');
  },
};
