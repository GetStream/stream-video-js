type AppEnvironment = 'pronto' | 'pronto-staging' | 'demo' | 'livestream';

declare module '@env' {
  export const REACT_NATIVE_DOGFOOD_APP_ENVIRONMENT: AppEnvironment;
  export const OVERRIDE_API_KEY: string | undefined;
  export const OVERRIDE_TOKEN: string | undefined;
  export const OVERRIDE_USER_ID: string | undefined;
  export const OVERRIDE_USER_NAME: string | undefined;
  export const OVERRIDE_USER_IMAGE_URL: string | undefined;
}
