import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingList,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';

import { Icon } from '../Icon';

interface SelectContextValue {
  activeIndex: number | null;
  selectedIndex: number | null;
  getItemProps: ReturnType<typeof useInteractions>['getItemProps'];
  handleSelect: (index: number | null) => void;
}

const SelectContext = createContext<SelectContextValue>(
  {} as SelectContextValue,
);

const Select = (props: {
  children: ReactNode;
  icon?: string;
  defaultSelectedLabel: string;
  defaultSelectedIndex: number;
  handleSelect: (index: number) => void;
}) => {
  const {
    children,
    icon,
    defaultSelectedLabel,
    defaultSelectedIndex,
    handleSelect: handleSelectProp,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    defaultSelectedIndex,
  );
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    defaultSelectedLabel,
  );

  const { refs, context } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [flip()],
  });

  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  const labelsRef = useRef<Array<string | null>>([]);

  const handleSelect = useCallback(
    (index: number | null) => {
      setSelectedIndex(index);
      handleSelectProp(index || 0);
      setIsOpen(false);
      if (index !== null) {
        setSelectedLabel(labelsRef.current[index]);
      }
    },
    [handleSelectProp],
  );

  const handleTypeaheadMatch = (index: number | null) => {
    if (isOpen) {
      setActiveIndex(index);
    } else {
      handleSelect(index);
    }
  };

  const listNav = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
  });
  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch: handleTypeaheadMatch,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [listNav, typeahead, click, dismiss, role],
  );

  const selectContext = useMemo(
    () => ({
      activeIndex,
      selectedIndex,
      getItemProps,
      handleSelect,
    }),
    [activeIndex, selectedIndex, getItemProps, handleSelect],
  );

  return (
    <div className="str-video__dropdown">
      <div
        className="str-video__dropdown-selected"
        ref={refs.setReference}
        tabIndex={0}
        {...getReferenceProps()}
      >
        <label className="str-video__dropdown-selected__label">
          {icon && (
            <Icon className="str-video__dropdown-selected__icon" icon={icon} />
          )}
          {selectedLabel}
        </label>
        <Icon
          className="str-video__dropdown-selected__chevron"
          icon={isOpen ? 'chevron-up' : 'chevron-down'}
        />
      </div>
      <SelectContext.Provider value={selectContext}>
        {isOpen && (
          <FloatingFocusManager context={context} modal={false}>
            <div
              className="str-video__dropdown-list"
              ref={refs.setFloating}
              {...getFloatingProps()}
            >
              <FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
                {children}
              </FloatingList>
            </div>
          </FloatingFocusManager>
        )}
      </SelectContext.Provider>
    </div>
  );
};

export type DropDownSelectOptionProps = {
  label: string;
  selected?: boolean;
  icon?: string;
};

export const DropDownSelectOption = (props: DropDownSelectOptionProps) => {
  const { selected, label, icon } = props;
  const { getItemProps, handleSelect } = useContext(SelectContext);
  const { ref, index } = useListItem();
  return (
    <div
      className={clsx('str-video__dropdown-option', {
        'str-video__dropdown-option--selected': selected,
      })}
      ref={ref}
      {...getItemProps({
        onClick: () => handleSelect(index),
      })}
    >
      {icon && <Icon className="str-video__dropdown-icon" icon={icon} />}
      <span className="str-video__dropdown-label">{label}</span>
    </div>
  );
};

export const DropDownSelect = (props: {
  icon?: string;
  defaultSelectedLabel: string;
  defaultSelectedIndex: number;
  handleSelect: (index: number) => void;
  children:
    | ReactElement<DropDownSelectOptionProps>
    | ReactElement<DropDownSelectOptionProps>[];
}) => {
  const {
    children,
    icon,
    handleSelect,
    defaultSelectedLabel,
    defaultSelectedIndex,
  } = props;
  return (
    <Select
      icon={icon}
      handleSelect={handleSelect}
      defaultSelectedIndex={defaultSelectedIndex}
      defaultSelectedLabel={defaultSelectedLabel}
    >
      {children}
    </Select>
  );
};
