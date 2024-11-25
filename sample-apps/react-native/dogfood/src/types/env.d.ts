type AppEnvironment = 'pronto' | 'pronto-staging' | 'demo';

declare module '@env' {
  export const REACT_NATIVE_DOGFOOD_APP_ENVIRONMENT: AppEnvironment;
}
