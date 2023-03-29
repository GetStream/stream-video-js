import { useCall } from '@stream-io/video-react-sdk';
import { LayoutMap } from './LayoutSelector';

export const Stage = ({
  selectedLayout,
}: {
  selectedLayout: keyof typeof LayoutMap;
}) => {
  const call = useCall();

  const SelectedComponent = LayoutMap[selectedLayout].Component;

  if (selectedLayout === 'LegacyGrid' || selectedLayout === 'LegacySpeaker') {
    return (
      <div className="str-video__stage">
        <SelectedComponent call={call!} />
      </div>
    );
  }

  // @ts-expect-error
  return <SelectedComponent />;
};
