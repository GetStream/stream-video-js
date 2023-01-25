import { ComponentProps, useEffect, useState } from 'react';
import clsx from 'clsx';

type SearchInputProps = ComponentProps<'input'> & {
  exitSearch: () => void;
  isActive: boolean;
};
export const SearchInput = ({
  exitSearch,
  isActive,
  ...rest
}: SearchInputProps) => {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(
    null,
  );
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'escape') exitSearch();
    };

    inputElement?.addEventListener('keydown', handleKeyDown);

    return () => {
      inputElement?.removeEventListener('keydown', handleKeyDown);
    };
  }, [exitSearch, inputElement]);

  return (
    <div
      className={clsx('str-video__search-input__container', {
        active: isActive,
      })}
    >
      <input placeholder="Search" {...rest} ref={setInputElement} />
      {isActive ? (
        <button
          className="str-video__search-input__clear-btn"
          onClick={exitSearch}
        >
          <span className="str-video__search-input__icon--active" />
        </button>
      ) : (
        <span className="str-video__search-input__icon" />
      )}
    </div>
  );
};
