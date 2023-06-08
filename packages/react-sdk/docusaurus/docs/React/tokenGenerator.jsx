import React from 'react';

const url = 'https://stream-calls-dogfood.vercel.app/api/auth/create-token?';

export async function tokenProvider(userId, apiKey) {
  const constructedUrl = constructUrl(userId, apiKey);
  const response = await fetch(constructedUrl);
  const resultObject = await response.json();
  let token = resultObject.token;
  return token;
}

function constructUrl(userId, apiKey) {
  return (
    url +
    new URLSearchParams({
      api_key: apiKey,
      user_id: userId,
    })
  );
}

export class TokenSnippet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      token: 'Loading token...',
      userName: props.name ?? 'testUser',
      platform: props.platform ?? 'react',
      sampleApp: props.sampleApp ?? 'audio-sample',
    };
  }

  componentDidMount() {
    tokenProvider(this.state.userName, getAPIKey(this.state.sampleApp)).then(
      (token) => {
        this.setState({ ...this.state, token: token });
      },
    );
  }

  render() {
    const code = getCode(
      this.state.platform,
      this.state.token,
      this.state.userName,
      this.state.sampleApp,
    );
    const styles = {
      color: 'rgb(191, 199, 213)',
      backgroundColor: 'rgb(41, 45, 62)',
    };
    return <pre style={styles}>{code}</pre>;
  }
}

function getAPIKey(sampleApp) {
  let apiKey = '';
  if (sampleApp === 'audio-sample') {
    apiKey = 'hd8szvscpxvd';
  }

  return apiKey;
}

function getCode(platform, token, userName, sampleApp) {
  let code = '';
  if (platform === 'react') {
    code = `const client = useCreateStreamVideoClient({
  apiKey: '${getAPIKey(sampleApp)}',
  tokenOrProvider: '${token}',
  user: '${userName}',
});`;
  } else if (platform === 'iOS') {
    code = `iOS is cool.`;
  }

  return code;
}
