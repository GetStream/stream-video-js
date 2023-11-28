import { Children, forwardRef, PropsWithChildren, useState } from 'react';
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
  useI18n,
} from '@stream-io/video-react-sdk';

import { LayoutSelector, LayoutSelectorProps } from '../LayoutSelector';
import { LanguageMenu } from './LanguageMenu';
import { CallRecordings } from '../CallRecordings';

import { useLanguage } from '../../hooks/useLanguage';

type ToggleSettingsTabModalProps = {
  close?: () => void;
  inMeeting: boolean;
};

type SettingsTabModalProps = {
  close?: () => void;
};

type TabProps = {
  active: boolean;
  setActive: () => void;
};

type TabPanelProps = {
  title: string;
  close?: () => void;
};

type TabWrapperProps = {
  icon: string;
  label: string;
  inMeeting?: boolean;
};

const Tab = ({ children, active, setActive }: PropsWithChildren<TabProps>) => {
  return (
    <div
      className={clsx('str-video__tab', {
        'str-video__tab--active': active,
      })}
      onClick={setActive}
    >
      {children}
    </div>
  );
};

const TabPanel = ({ children, close }: PropsWithChildren<TabPanelProps>) => {
  return (
    <div className="str-video__tab-panel">
      <div className="str-video__tab-panel__header">
        <IconButton
          className="str-video__tab-panel__close"
          icon="close"
          onClick={close}
        />
      </div>
      <div className="str-video__tab-panel__content">{children}</div>
    </div>
  );
};

export const SettingsTabModal = ({
  children,
  close,
}: PropsWithChildren<SettingsTabModalProps>) => {
  const [active, setActive] = useState(0);
  return (
    <div className="str-video__tabmodal-container">
      <div className="str-video__tabmodal-sidebar">
        <h2 className="str-video__tabmodal-header">Settings</h2>
        {Children.map(children, (child: any, index: number) => {
          if (!child.props.inMeeting) return null;

          return (
            <Tab
              key={index}
              active={index === active}
              setActive={() => setActive(index)}
            >
              <Icon className="str-video__tab-icon" icon={child.props.icon} />
              {child.props.label}
            </Tab>
          );
        })}
      </div>
      <div className="str-video__tabmodal-content">
        {Children.map(children, (child: any, index: number) => {
          if (index !== active) return null;
          return (
            <TabPanel key={index} title={child.props.title} close={close}>
              {child}
            </TabPanel>
          );
        })}
      </div>
    </div>
  );
};

export const TabWrapper = ({
  children,
}: PropsWithChildren<TabWrapperProps>) => {
  return children;
};

export const ToggleMenuButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <CompositeButton>
      <IconButton ref={ref} icon="device-settings" />
    </CompositeButton>
  );
});

export const ToggleSettingsTabModal = (
  props: ToggleSettingsTabModalProps & LayoutSelectorProps,
) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();

  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.PORTAL}
    >
      <SettingsTabModal>
        <TabWrapper
          icon="device-settings"
          label={t('Device settings')}
          inMeeting
        >
          <>
            <DeviceSelectorVideo visualType="dropdown" />
            <DeviceSelectorAudioInput visualType="dropdown" />
            <DeviceSelectorAudioOutput visualType="dropdown" />
          </>
        </TabWrapper>
        <TabWrapper icon="grid" label={t('Layout')} inMeeting>
          <LayoutSelector
            onMenuItemClick={props.onMenuItemClick}
            selectedLayout={props.selectedLayout}
          />
        </TabWrapper>
        <TabWrapper
          icon="stats"
          label={t('Statistics')}
          inMeeting={props.inMeeting}
        >
          <CallStats />
        </TabWrapper>

        <TabWrapper icon="language" label={t('Language')} inMeeting>
          <LanguageMenu language={language} setLanguage={setLanguage} />
        </TabWrapper>

        <TabWrapper
          icon="film-roll"
          label={t('Recording library')}
          inMeeting={props.inMeeting}
        >
          <CallRecordings />
        </TabWrapper>
      </SettingsTabModal>
    </MenuToggle>
  );
};
