import {
  createContext,
  type CSSProperties,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

const COLOR_PARAM_TO_CSS_VAR = {
  bg_color_0: '--str-video__background-color0',
  bg_color_1: '--str-video__background-color1',
  bg_color_2: '--str-video__background-color2',
  bg_color_4: '--str-video__background-color4',
  bg_color_5: '--str-video__background-color5',
  base_color_1: '--str-video__base-color1',
  base_color_2: '--str-video__base-color2',
  base_color_3: '--str-video__base-color3',
  base_color_4: '--str-video__base-color4',
  base_color_5: '--str-video__base-color5',
  base_color_6: '--str-video__base-color6',
  base_color_7: '--str-video__base-color7',
  text_color_1: '--str-video__text-color1',
  text_color_2: '--str-video__text-color2',
  btn_default_base: '--str-video__button-default-base',
  btn_default_hover: '--str-video__button-default-hover',
  btn_primary_base: '--str-video__button-primary-base',
  btn_primary_hover: '--str-video__button-primary-hover',
  btn_secondary_base: '--str-video__button-secondary-base',
  btn_tertiary_base: '--str-video__button-tertiary-base',
  icon_default: '--str-video__icon-default',
  icon_hover: '--str-video__icon-hover',
  icon_active: '--str-video__icon-active',
  primary_color: '--str-video__primary-color',
} as const;

export type ThemeStyle = CSSProperties & Record<string, string>;

export interface Configuration {
  apiKey: string;
  callId: string;
  callType: string;
  userType: string;
  userId: string;
  userName?: string;
  userImage?: string;
  token?: string;
  skipLobby: boolean;
  layout?: string;
  theme?: ThemeStyle;
}

const isValidHex = (v: string | null): v is string =>
  v !== null && /^#?[0-9A-Fa-f]{6}$/.test(v);

const normalizeColor = (v: string): string => (v.startsWith('#') ? v : `#${v}`);

const generateId = (): string => crypto.randomUUID().slice(0, 8);

const parseThemeStyle = (params: URLSearchParams): ThemeStyle => {
  return Object.entries(COLOR_PARAM_TO_CSS_VAR).reduce<ThemeStyle>(
    (acc, [param, cssVar]) => {
      const value = params.get(param);
      if (isValidHex(value)) {
        acc[cssVar] = normalizeColor(value);
      }
      return acc;
    },
    {},
  );
};

const parseConfiguration = (): Configuration => {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  const userTypeParam = params.get('user_type');
  const userType = userTypeParam ? userTypeParam : 'guest';

  let userId = params.get('user_id');
  if (userType === 'guest' && !userId) {
    userId = `guest_${generateId()}`;
  }
  if (userType === 'anonymous') {
    userId = `anon_${generateId()}`;
  }

  return {
    apiKey: params.get('api_key')!,
    callId: params.get('call_id')!,
    callType: params.get('call_type') || 'default',
    userType,
    userId: userId!,
    userName: params.get('user_name') || undefined,
    userImage: params.get('user_image') || undefined,
    token: params.get('token') || undefined,
    skipLobby: params.get('skip_lobby') === 'true',
    theme: parseThemeStyle(params),
    layout: params.get('layout') || undefined,
  };
};

const ConfigurationContext = createContext<Configuration | null>(null);

export const useConfiguration = (): Configuration => {
  const ctx = useContext(ConfigurationContext);
  if (!ctx) {
    throw new Error(
      'useConfiguration must be used within ConfigurationProvider',
    );
  }
  return ctx;
};

export const ConfigurationProvider = ({ children }: PropsWithChildren) => {
  const value = useMemo(() => parseConfiguration(), []);

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};
