import { createContext, useContext } from 'react';
import { decode } from 'js-base64';

type ConfigurationValue = {
  base_url?: string;
  api_key: string;
  token: string;
  user_id: string;
  call_id: string;
  call_type: string;

  options: {
    video?: {
      background_color?: string;
      scale_mode?: 'fill' | 'fit';
      screenshare_scale_mode?: 'fill' | 'fit';
    };
    logo?: {
      image_url?: string;
      horizontal_position?: 'center' | 'left' | 'right';
      vertical_position?: 'center' | 'left' | 'right';
    };
    participant?: {
      label_display?: boolean;
      label_text_color?: string;
      label_background_color?: string;
      label_display_border?: boolean;
      label_border_radius?: string;
      label_border_color?: string;
      label_horizontal_position?: 'center' | 'left' | 'right';
      label_vertical_position?: 'center' | 'left' | 'right';

      // participant_border_color: string;
      // participant_border_radius: string;
      // participant_border_width: string;
      participant_highlight_border_color?: string; // talking
      placeholder_background_color?: string;
    };

    layout?: {
      // used with any layout
      size_percentage?: number;

      main?: 'grid' | 'dominant_speaker' | 'spotlight'; // | 'mobile'
      screenshare?: 'spotlight' | 'dominant_speaker';

      // grid-specific
      gap?: string;
      page_size?: number;
      // dominant_speaker-specific (single-participant)
      mode?: 'shuffle' | 'default';
      // spotlight-specific
      bar_position?: 'top' | 'right' | 'bottom' | 'left';
    };
  };
};

export const ConfigurationContext = createContext<ConfigurationValue>(
  {} as ConfigurationValue,
);

export const extractPayloadFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Malformed token, missing payload');

  return (JSON.parse(decode(payload)) ?? {}) as Record<string, unknown>;
};

export const useConfigurationContext = () => useContext(ConfigurationContext);
