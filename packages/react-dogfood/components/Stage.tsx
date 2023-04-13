import { PermissionRequests, useCall } from '@stream-io/video-react-sdk';
import { useSearchParams } from 'next/navigation';
import { LayoutMap } from './LayoutSelector';

export const Stage = ({
  selectedLayout,
}: {
  selectedLayout: keyof typeof LayoutMap;
}) => {
  const call = useCall();
  const searchParams = useSearchParams();
  const groupSize = +(searchParams.get('group_size') ?? '0');

  const SelectedComponent = LayoutMap[selectedLayout].Component;

  return (
    <div className="str-video__stage">
      <PermissionRequests />
      <SelectedComponent
        call={call!}
        groupSize={!groupSize || groupSize > 16 ? undefined : groupSize}
      />
    </div>
  );
};
