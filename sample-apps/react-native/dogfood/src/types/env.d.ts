type AppEnvironment = 'pronto' | 'demo';

declare module '@env' {
  export const ENVIRONMENT: AppEnvironment;
}
