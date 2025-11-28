export type AppConfig = {
  apiKey: string;
  secret: string;
  // a link to the app that can be opened in a browser:
  // https://sample.app/rooms/join/{type}/{id}?user_id={userId}&user_name={user_name}&token={token}&api_key={api_key}
  // supported replacements:
  // - {type}, {id},
  // - {userId}, {user_name}, {token},
  // - {api_key}
  deepLink?: string;
  defaultCallType?: string;
};

export type SampleAppCallConfig = {
  [appType: string]: AppConfig | undefined;
};

export type AppEnvironment = 'pronto' | 'demo' | (string & {});

const config: SampleAppCallConfig = JSON.parse(
  process.env.SAMPLE_APP_CALL_CONFIG || '{}',
);

// 'pronto' is a special environment that we ensure it exists
if (!config['pronto']) {
  config.pronto = {
    apiKey: process.env.STREAM_API_KEY!,
    secret: process.env.STREAM_SECRET_KEY!,
  };
}

export const getEnvironmentConfig = (env: AppEnvironment) => {
  const appConfig = config[env];
  if (!appConfig) {
    throw new Error(`Invalid environment: ${env}`);
  }

  if (!appConfig.apiKey || !appConfig.secret) {
    throw new Error(`Environment '${env}' is not configured properly.`);
  }

  return appConfig;
};
