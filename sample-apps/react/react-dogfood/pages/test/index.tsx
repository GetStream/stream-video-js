import dynamic from 'next/dynamic';

const Inspector = dynamic(
  () => import('../../components/Inspector/Inspector'),
  { ssr: false },
);

export default function DeviceTestPage() {
  return <Inspector autoJoinDemoCall />;
}
