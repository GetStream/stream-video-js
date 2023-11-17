import {
  FC,
  PropsWithChildren,
  Children,
  isValidElement,
  cloneElement,
  useRef,
  useCallback,
  useState,
  useMemo,
  createContext,
  ReactNode,
  useContext,
} from 'react';

import {
  autoUpdate,
  flip,
  useFloating,
  useInteractions,
  useListNavigation,
  useTypeahead,
  useClick,
  useDismiss,
  useListItem,
  useRole,
  FloatingFocusManager,
  FloatingList,
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

export const Select = ({
  children,
  icon,
  defaultSelectedLabel,
  defaultSelectedIndex,
  handleSelect: handleSelectPropergation,
}: {
  children: ReactNode;
  icon?: string;
  selectedLabel?: string;
  defaultSelectedLabel: string;
  defaultSelectedIndex: number;
  handleSelect: (index: number) => void;
}) => {
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

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
    handleSelectPropergation(index || 0);
    setIsOpen(false);
    if (index !== null) {
      setSelectedLabel(labelsRef.current[index]);
    }
  }, []);

  function handleTypeaheadMatch(index: number | null) {
    if (isOpen) {
      setActiveIndex(index);
    } else {
      handleSelect(index);
    }
  }

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
    <>
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
    </>
  );
};

const Option: FC<PropsWithChildren> = ({ children }) => {
  const { activeIndex, selectedIndex, getItemProps, handleSelect } =
    useContext(SelectContext);

  const { ref, index } = useListItem();

  const isActive = activeIndex === index;
  const isSelected = selectedIndex === index;

  const childrenWithProps = Children.map(children, (child: any) => {
    if (
      isValidElement(child) &&
      typeof child === 'number' &&
      typeof child === 'string'
    ) {
      const element = cloneElement(child, { isActive, isSelected });
      return element;
    }
    return child;
  });

  return (
    <div
      ref={ref}
      {...getItemProps({
        onClick: () => handleSelect(index),
      })}
    >
      {childrenWithProps}
    </div>
  );
};

export const DropDownSelect: FC<
  {
    icon?: string;
    defaultSelectedLabel: string;
    defaultSelectedIndex: number;
    handleSelect: (index: number) => void;
  } & PropsWithChildren
> = ({
  children,
  icon,
  handleSelect,
  defaultSelectedLabel,
  defaultSelectedIndex,
}) => {
  return (
    <Select
      icon={icon}
      handleSelect={handleSelect}
      defaultSelectedIndex={defaultSelectedIndex}
      defaultSelectedLabel={defaultSelectedLabel}
    >
      {Children.map(children, (child: any) => {
        return <Option {...child.props}>{child}</Option>;
      })}
    </Select>
  );
};
