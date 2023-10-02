import { createContext, useContext } from 'react';
import { decode } from 'js-base64';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

import { Layout, ScreenshareLayout } from './components/layouts';

const DEFAULT_USER_ID = 'egress';
const DEFAULT_CALL_TYPE = 'default';

type HorizontalPosition = 'center' | 'right' | 'left';
type VerticalPosition = 'center' | 'top' | 'bottom';
type ObjectFit = 'fit' | 'fill';

export const positionMap: {
  vertical: Record<VerticalPosition, string>;
  horizontal: Record<HorizontalPosition, string>;
} = {
  vertical: {
    center: 'center',
    top: 'start',
    bottom: 'end',
  },
  horizontal: {
    center: 'center',
    right: 'end',
    left: 'start',
  },
};

export const objectFitMap: Record<ObjectFit, string> = {
  fit: 'contain',
  fill: 'cover',
};

export type ConfigurationValue = {
  base_url?: string;

  api_key: string;
  call_type: string;
  call_id: string;
  token: string;
  user_id: string; // pulled from the token payload

  ext_css?: string;

  layout?: Layout;
  screenshare_layout?: ScreenshareLayout;

  test_environment?: {
    participants?: Partial<StreamVideoParticipant>[];
  };

  options: {
    // ✅
    'video.background_color'?: string;
    'video.scale_mode'?: ObjectFit;
    'video.screenshare_scale_mode'?: ObjectFit;

    // ✅
    'logo.image_url'?: string;
    'logo.width'?: string;
    'logo.height'?: string;
    'logo.horizontal_position'?: HorizontalPosition;
    'logo.vertical_position'?: VerticalPosition;
    'logo.margin_inline'?: string;
    'logo.margin_block'?: string;

    // ✅
    'title.text'?: string;
    'title.font_size'?: string;
    'title.color'?: string;
    'title.horizontal_position'?: HorizontalPosition;
    'title.vertical_position'?: VerticalPosition;
    'title.margin_block'?: string;
    'title.margin_inline'?: string;

    // ✅
    'participant.outline_color'?: string;
    'participant.outline_width'?: string;
    'participant.border_radius'?: string;
    'participant.placeholder_background_color'?: string;

    // ✅
    'participant_label.display'?: boolean;
    'participant_label.text_color'?: string;
    'participant_label.background_color'?: string;
    'participant_label.border_width'?: string;
    'participant_label.border_radius'?: string;
    'participant_label.border_color'?: string;
    'participant_label.horizontal_position'?: HorizontalPosition;
    'participant_label.vertical_position'?: VerticalPosition;
    'participant_label.margin_inline'?: string;
    'participant_label.margin_block'?: string;

    // used with any layout
    'layout.size_percentage'?: number; // ❌
    'layout.background_color'?: string; // ✅
    'layout.background_image'?: string; // ✅
    'layout.background_size'?: string; // ✅
    'layout.background_position'?: string; // ✅
    'layout.background_repeat'?: string; // ✅

    // grid-specific
    'layout.grid.gap'?: string; // ❌
    'layout.grid.page_size'?: number; // ✅
    // dominant_speaker-specific (single-participant)
    'layout.single-participant.mode'?: 'shuffle' | 'default'; // ✅
    'layout.single-participant.shuffle_delay'?: number; // ✅
    'layout.single-participant.padding_inline'?: string; // ✅
    'layout.single-participant.padding_block'?: string; // ✅
    // spotlight-specific
    'layout.spotlight.participants_bar_position'?: Exclude<
      VerticalPosition | HorizontalPosition,
      'center'
    >; // ✅
    'layout.spotlight.participants_bar_limit'?: 'dynamic' | number; // ✅
  };
};

export const ConfigurationContext = createContext<ConfigurationValue>(
  {} as ConfigurationValue,
);

export const extractPayloadFromToken = (
  token: string,
): Record<string, string | undefined> => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Malformed token, missing payload');

  try {
    return JSON.parse(decode(payload)) ?? {};
  } catch (e) {
    console.log('Error parsing token payload', e);
    return {};
  }
};

export const useConfigurationContext = () => useContext(ConfigurationContext);

export const applyConfigurationDefaults = (
  configuration: ConfigurationValue,
) => {
  const {
    // apply defaults
    api_key = import.meta.env.VITE_STREAM_API_KEY as string,
    token = import.meta.env.VITE_STREAM_USER_TOKEN as string,
    user_id = extractPayloadFromToken(token)['user_id'] ?? DEFAULT_USER_ID,
    call_type = DEFAULT_CALL_TYPE,
    options = {},
    ...rest
  } = configuration;

  return {
    api_key,
    token,
    user_id,
    call_type,
    options,
    ...rest,
  };
};
