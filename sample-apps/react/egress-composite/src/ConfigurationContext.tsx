import { createContext, useContext } from 'react';
import { decode } from 'js-base64';

export type ConfigurationValue = {
  base_url?: string;

  api_key: string;
  call_type: string;
  call_id: string;
  token: string;
  user_id: string; // pulled from the token payload

  ext_css?: string;

  layout?: 'grid' | 'single_participant' | 'spotlight' | 'mobile';
  screenshare_layout?: 'single_participant' | 'spotlight';

  options: {
    'video.background_color'?: string;
    'video.scale_mode'?: 'fill' | 'fit';
    'video.screenshare_scale_mode'?: 'fill' | 'fit';

    'logo.image_url'?: string;
    'logo.horizontal_position'?: 'center' | 'left' | 'right';
    'logo.vertical_position'?: 'center' | 'left' | 'right';

    'participant.label_display'?: boolean;
    'participant.label_text_color'?: string;
    'participant.label_background_color'?: string;
    'participant.label_display_border'?: boolean;
    'participant.label_border_radius'?: string;
    'participant.label_border_color'?: string;
    'participant.label_horizontal_position'?: 'center' | 'left' | 'right';
    'participant.label_vertical_position'?: 'center' | 'left' | 'right';

    // participant_border_color: string;
    // participant_border_radius: string;
    // participant_border_width: string;
    'participant.participant_highlight_border_color'?: string; // talking
    'participant.placeholder_background_color'?: string;

    // used with any layout
    'layout.size_percentage'?: number;

    // grid-specific
    'layout.grid.gap'?: string;
    'layout.grid.page_size'?: number;
    // dominant_speaker-specific (single-participant)
    'layout.single_participant.mode'?: 'shuffle' | 'default';
    'layout.single_participant.shuffle_delay'?: number;
    // spotlight-specific
    'layout.spotlight.bar_position'?: 'top' | 'right' | 'bottom' | 'left';
    'layout.spotlight.bar_limit'?: number;
  };
};

export const ConfigurationContext = createContext<ConfigurationValue>(
  {} as ConfigurationValue,
);

export const extractPayloadFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Malformed token, missing payload');

  try {
    return (JSON.parse(decode(payload)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    console.log('Error parsing token payload', e);
    return {};
  }
};

export const useConfigurationContext = () => useContext(ConfigurationContext);
