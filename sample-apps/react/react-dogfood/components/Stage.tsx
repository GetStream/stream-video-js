import { useSearchParams } from 'next/navigation';
import { LayoutMap } from '../hooks';

export const Stage = ({
  selectedLayout,
}: {
  selectedLayout: keyof typeof LayoutMap;
}) => {
  const searchParams = useSearchParams();
  const groupSize = +(searchParams.get('group_size') ?? '0');

  const SelectedComponent = LayoutMap[selectedLayout].Component;
  const props = LayoutMap[selectedLayout].props;

  if (selectedLayout === 'LegacyGrid' || selectedLayout === 'LegacySpeaker') {
    return (
      <div className="rd__stage">
        <SelectedComponent {...LayoutMap[selectedLayout].props} />
      </div>
    );
  }

  return (
    // @ts-expect-error - TS doesn't know about the groupSize prop
    <SelectedComponent
      {...props}
      // @ts-expect-error - TS doesn't know about the groupSize prop
      // eslint-disable-next-line react/prop-types
      groupSize={!groupSize || groupSize > 16 ? props?.groupSize : groupSize}
    />
  );
};
