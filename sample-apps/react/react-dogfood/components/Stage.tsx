import { useCall } from '@stream-io/video-react-sdk';
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
  const props = LayoutMap[selectedLayout].props;

  if (selectedLayout === 'LegacyGrid' || selectedLayout === 'LegacySpeaker') {
    return (
      <div className="str-video__stage">
        <SelectedComponent call={call!} />
      </div>
    );
  }

  return (
    // @ts-expect-error
    <SelectedComponent
      {...props}
      // @ts-expect-error
      groupSize={!groupSize || groupSize > 16 ? props?.groupSize : groupSize}
    />
  );
};
