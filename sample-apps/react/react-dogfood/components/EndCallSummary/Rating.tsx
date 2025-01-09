import { Icon } from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { useCallback, useState } from 'react';

type RatingProps = {
  rating: { current: number; maxAmount: number };
  handleSetRating: (value: { current: number; maxAmount: number }) => void;
};

export function Rating({ rating, handleSetRating }: RatingProps) {
  const [hoveredGrade, setHoveredGrade] = useState<number | null>(null);

  const getColor = (v: number) =>
    v <= 2 ? 'bad' : v > 2 && v <= 4 ? 'good' : 'great';

  const handleRating = useCallback(
    (grade: number) => {
      handleSetRating({
        ...rating,
        maxAmount: rating.maxAmount,
        current: grade,
      });
    },
    [handleSetRating, rating],
  );

  return (
    <div className="rd__feedback-rating-stars">
      {[...new Array(rating.maxAmount)].map((_, index) => {
        const grade = index + 1;
        const active = grade <= rating.current;
        const isHovered = hoveredGrade !== null && grade <= hoveredGrade;

        const modifier = isHovered
          ? getColor(hoveredGrade!)
          : active
            ? getColor(rating.current)
            : getColor(grade);

        return (
          <div
            key={index}
            onClick={() => handleRating(grade)}
            onMouseEnter={() => setHoveredGrade(grade)}
            onMouseLeave={() => setHoveredGrade(null)}
          >
            <Icon
              icon="star"
              className={clsx(
                'rd__feedback-star',
                `rd__feedback-star--${modifier}`,
                (active || isHovered) &&
                  `rd__feedback-star--active-${modifier}`,
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
