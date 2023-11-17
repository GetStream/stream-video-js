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
} from '@stream-io/video-react-sdk';

import { LayoutSelector, LayoutSelectorProps } from '../LayoutSelector';
import { LanguageMenu } from './LanguageMenu';

import { useLanguage } from '../../hooks/useLanguage';

type ToggleSettingsTabModalProps = {
  close: () => void;
};

type SettingsTabModalProps = {
  close: () => void;
};

type TabProps = {
  active: boolean;
  setActive: () => void;
};

type TabPanelProps = {
  title: string;
  close: () => void;
};

type TabWrapperProps = {
  icon: string;
  label: string;
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
      {children}
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
        {Children.map(children, (child: any, index: number) => (
          <Tab
            key={index}
            active={index === active}
            setActive={() => setActive(index)}
          >
            <Icon className="str-video__tab-icon" icon={child.props.icon} />
            {child.props.label}
          </Tab>
        ))}
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

  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.PORTAL}
    >
      <SettingsTabModal close={props.close}>
        <TabWrapper icon="device-settings" label="Device settings">
          <>
            <DeviceSelectorVideo visualType="dropdown" />
            <DeviceSelectorAudioInput visualType="dropdown" />
            <DeviceSelectorAudioOutput visualType="dropdown" />
          </>
        </TabWrapper>
        <TabWrapper icon="grid" label="Layout">
          <LayoutSelector
            onMenuItemClick={props.onMenuItemClick}
            selectedLayout={props.selectedLayout}
          />
        </TabWrapper>
        <TabWrapper icon="stats" label="Statistics">
          <CallStats />
        </TabWrapper>
        <TabWrapper icon="language" label="Language">
          <LanguageMenu language={language} setLanguage={setLanguage} />
        </TabWrapper>
      </SettingsTabModal>
    </MenuToggle>
  );
};
