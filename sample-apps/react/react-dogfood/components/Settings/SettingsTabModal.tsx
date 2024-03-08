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
  useBackgroundFilters,
  useI18n,
  useMenuContext,
  VideoPreview,
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
  const { close } = useMenuContext();
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
  const { setLanguage } = useLanguage();
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
      <TabWrapper icon="video-effects" label="Effects" inMeeting>
        <VideoEffectsSettings />
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
        <LanguageMenu setLanguage={setLanguage} />
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
>(function ToggleSettingsMenuButton(props, ref) {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <Icon icon="device-settings" />
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

const VideoEffectsSettings = () => {
  const {
    backgroundImages,
    isBlurringEnabled,
    backgroundBlurLevel,
    backgroundImage,
    backgroundFilter,
    disableBackgroundFilter,
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
  } = useBackgroundFilters();
  return (
    <div className="rd__video-effects">
      <div className="rd__video-effects__preview-container">
        <VideoPreview />
      </div>
      <div className="rd__video-effects__container">
        <div className="rd__video-effects__card">
          <h4>Effects</h4>
          <div className="rd__video-effects__list">
            <CompositeButton
              title="Disable"
              active={backgroundFilter === 'none'}
              onClick={() => disableBackgroundFilter()}
            >
              <Icon icon="close" />
            </CompositeButton>
            {isBlurringEnabled && (
              <>
                <CompositeButton
                  title="Blur"
                  active={
                    backgroundFilter === 'blur' &&
                    backgroundBlurLevel === 'high'
                  }
                  onClick={() => applyBackgroundBlurFilter('high')}
                >
                  <Icon icon="blur-icon" />
                </CompositeButton>
                <CompositeButton
                  title="Medium blur"
                  active={
                    backgroundFilter === 'blur' &&
                    backgroundBlurLevel === 'medium'
                  }
                  onClick={() => applyBackgroundBlurFilter('medium')}
                >
                  <Icon
                    icon="blur-icon"
                    className="rd__video-effects__blur--medium"
                  />
                </CompositeButton>
                <CompositeButton
                  title="Low blur"
                  active={
                    backgroundFilter === 'blur' && backgroundBlurLevel === 'low'
                  }
                  onClick={() => applyBackgroundBlurFilter('low')}
                >
                  <Icon
                    icon="blur-icon"
                    className="rd__video-effects__blur--low"
                  />
                </CompositeButton>
              </>
            )}
          </div>
        </div>
        {backgroundImages && backgroundImages.length > 0 && (
          <div className="rd__video-effects__card">
            <h4>Backgrounds</h4>
            <div className="rd__video-effects__list">
              {backgroundImages.map((imageUrl, index) => (
                <div key={index} className="rd__video-effects__list-box">
                  <img
                    className={clsx(
                      'rd__video-effects__image',
                      backgroundFilter === 'image' &&
                        backgroundImage === imageUrl &&
                        'rd__video-effects__image--active',
                    )}
                    src={imageUrl}
                    alt="Background"
                    onClick={() => applyBackgroundImageFilter(imageUrl)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
