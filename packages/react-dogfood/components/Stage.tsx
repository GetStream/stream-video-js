import { useSearchParams } from 'next/navigation';
import { LayoutMap } from './LayoutSelector';

export const Stage = ({
  selectedLayout,
}: {
  selectedLayout: keyof typeof LayoutMap;
}) => {
  const searchParams = useSearchParams();
  const groupSize = +(searchParams.get('group_size') ?? '0');

  const SelectedComponent = LayoutMap[selectedLayout].Component;
  const props = LayoutMap[selectedLayout].props;

  return (
    // @ts-expect-error
    <SelectedComponent
      {...props}
      // @ts-expect-error
      groupSize={!groupSize || groupSize > 16 ? props?.groupSize : groupSize}
    />
  );
};
