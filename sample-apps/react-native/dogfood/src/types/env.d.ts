type AppEnvironment =
  | 'pronto'
  | 'pronto-staging'
  | 'demo'
  | 'video-moderation'
  | 'stream-benchmark';

declare module '@env' {
  export const REACT_NATIVE_DOGFOOD_APP_ENVIRONMENT: AppEnvironment;
}
