import { forwardRef } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';

import { CallStats } from '../CallStats';
import { CompositeButton, IconButton } from '../Button/';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';

export type CallStatsButtonProps = {
  caption?: string;
};

export const CallStatsButton = () => (
  <MenuToggle placement="top-end" ToggleButton={ToggleMenuButton}>
    <CallStats />
  </MenuToggle>
);

const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps<HTMLDivElement> & CallStatsButtonProps
>(function ToggleMenuButton(props, ref) {
  const { t } = useI18n();
  const { caption, menuShown } = props;

  return (
    <CompositeButton
      ref={ref}
      active={menuShown}
      caption={caption}
      title={caption || t('Statistics')}
    >
      <IconButton icon="stats" data-testid="stats-button" />
    </CompositeButton>
  );
});
