import { Icon } from '@stream-io/video-react-sdk';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

type Props = {
  handelSelectFeedback: (types: string[] | undefined) => void;
  className?: string;
};

export const FeedbackType = ({ handelSelectFeedback, className }: Props) => {
  const [selectedTypes, setSelectedTypes] = useState<string[] | undefined>(
    undefined,
  );

  const types = ['Video', 'Audio', 'Other'];

  const handleSelectType = (type: string) => {
    setSelectedTypes((prevTypes) => [...(prevTypes || []), type]);
  };

  const handleRemoveType = (type: string) => {
    setSelectedTypes((prevTypes) =>
      (prevTypes || []).filter((t) => t !== type),
    );
  };

  useEffect(() => {
    handelSelectFeedback(selectedTypes);
  }, [selectedTypes]);

  return (
    <div className={clsx('rd__summary-feedback-type', className)}>
      {types.map((type) => (
        <div
          key={type}
          onClick={() =>
            selectedTypes?.includes(type)
              ? handleRemoveType(type)
              : handleSelectType(type)
          }
          className={clsx(
            'rd__summary-feedback-type-item',
            selectedTypes?.includes(type) &&
              'rd__summary-feedback-type-item--selected',
          )}
        >
          {!selectedTypes?.includes(type) && (
            <Icon className="rd__summary-feedback-type-item--add" icon="add" />
          )}
          {type}
          {selectedTypes?.includes(type) && (
            <Icon
              className="rd__summary-feedback-type-item--close"
              icon="close"
            />
          )}
        </div>
      ))}
    </div>
  );
};
