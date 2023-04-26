import { ComponentProps, useEffect, useState } from 'react';
import clsx from 'clsx';

type SearchInputProps = ComponentProps<'input'> & {
  /**
   * Resets the search to its initial state.
   * The function is called when Esc key or inputs clear button are pressed
   */
  exitSearch: () => void;
  /**
   * Flag to signal, whether search input elements should be rendered as active
   */
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
    if (!inputElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'escape') exitSearch();
    };

    inputElement.addEventListener('keydown', handleKeyDown);

    return () => {
      inputElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [exitSearch, inputElement]);

  return (
    <div
      className={clsx('str-video__search-input__container', {
        'str-video__search-input__container--active': isActive,
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
