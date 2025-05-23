type AppEnvironment =
  | 'pronto'
  | 'pronto-staging'
  | 'demo'
  | 'livestream'
  | 'video-moderation';

declare module '@env' {
  export const REACT_NATIVE_DOGFOOD_APP_ENVIRONMENT: AppEnvironment;
}
