import {
  Children,
  forwardRef,
  PropsWithChildren,
  ReactElement,
  useState,
} from 'react';
import clsx from 'clsx';

import {
  CallStats,
  CompositeButton,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  DeviceSelectorVideo,
  Icon,
  IconButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useI18n,
  useMenuPortalContext,
} from '@stream-io/video-react-sdk';

import { LayoutSelector, LayoutSelectorProps } from '../LayoutSelector';
import { LanguageMenu } from './LanguageMenu';
import { CallRecordings } from '../CallRecordings';

import { useLanguage } from '../../hooks/useLanguage';

type ToggleSettingsTabModalProps = {
  inMeeting: boolean;
  activeTab?: number;
};

type SettingsTabModalProps = {
  activeTab?: number;
  children: ReactElement<TabWrapperProps> | ReactElement<TabWrapperProps>[];
};

type TabProps = {
  active: boolean;
  setActive: () => void;
};

type TabWrapperProps = {
  icon: string;
  label: string;
  inMeeting?: boolean;
};

const Tab = ({ children, active, setActive }: PropsWithChildren<TabProps>) => {
  return (
    <div
      className={clsx('rd__tab', {
        'rd__tab--active': active,
      })}
      onClick={setActive}
    >
      {children}
    </div>
  );
};

const TabPanel = ({ children }: PropsWithChildren) => {
  const { close } = useMenuPortalContext();
  return (
    <div className="rd__tab-panel">
      <div className="rd__tab-panel__header">
        <h2 className="rd__tab-panel__heading">Settings</h2>
        <IconButton
          className="rd__tab-panel__close"
          icon="close"
          onClick={close}
        />
      </div>
      <div className="rd__tab-panel__content">{children}</div>
    </div>
  );
};

const SettingsTabModal = ({
  children,
  activeTab = 0,
}: SettingsTabModalProps) => {
  const [active, setActive] = useState(activeTab);
  return (
    <div className="rd__tabmodal-container">
      <div className="rd__tabmodal-sidebar">
        <h2 className="rd__tabmodal-header">Settings</h2>
        {Children.map(children, (child, index) => {
          if (!child.props.inMeeting) return null;
          return (
            <Tab
              key={index}
              active={index === active}
              setActive={() => setActive(index)}
            >
              <Icon className="rd__tab-icon" icon={child.props.icon} />
              <span className="rd__tab-label">{child.props.label}</span>
            </Tab>
          );
        })}
      </div>
      <div className="rd__tabmodal-content">
        {Children.map(children, (child, index) => {
          if (index !== active) return null;
          return <TabPanel key={index}>{child}</TabPanel>;
        })}
      </div>
    </div>
  );
};

const TabWrapper = ({ children }: PropsWithChildren<TabWrapperProps>) => {
  return children;
};

export const SettingsTabModalMenu = (props: {
  tabModalProps: ToggleSettingsTabModalProps;
  layoutProps: LayoutSelectorProps;
}) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();

  const { tabModalProps, layoutProps } = props;

  return (
    <SettingsTabModal {...tabModalProps}>
      <TabWrapper icon="device-settings" label={t('Device settings')} inMeeting>
        <>
          <DeviceSelectorVideo
            visualType="dropdown"
            title={t('Select a Camera')}
          />
          <DeviceSelectorAudioInput
            visualType="dropdown"
            title={t('Select a Mic')}
          />
          <DeviceSelectorAudioOutput
            visualType="dropdown"
            title={t('Select a Speaker')}
          />
        </>
      </TabWrapper>
      <TabWrapper icon="grid" label={t('Layout')} inMeeting>
        <LayoutSelector
          onMenuItemClick={layoutProps.onMenuItemClick}
          selectedLayout={layoutProps.selectedLayout}
        />
      </TabWrapper>
      <TabWrapper
        icon="stats"
        label={t('Statistics')}
        inMeeting={tabModalProps.inMeeting}
      >
        <CallStats />
      </TabWrapper>

      <TabWrapper icon="language" label={t('Language')} inMeeting>
        <LanguageMenu language={language} setLanguage={setLanguage} />
      </TabWrapper>

      <TabWrapper
        icon="film-roll"
        label={t('Recording library')}
        inMeeting={tabModalProps.inMeeting}
      >
        <CallRecordings />
      </TabWrapper>
    </SettingsTabModal>
  );
};

const ToggleSettingsMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>((props, ref) => {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <IconButton icon="device-settings" />
    </CompositeButton>
  );
});

export const ToggleSettingsTabModal = (props: {
  tabModalProps: ToggleSettingsTabModalProps;
  layoutProps: LayoutSelectorProps;
}) => {
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleSettingsMenuButton}
      visualType={MenuVisualType.PORTAL}
    >
      <SettingsTabModalMenu {...props} />
    </MenuToggle>
  );
};
