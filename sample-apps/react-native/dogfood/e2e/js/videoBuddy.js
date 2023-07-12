const params = [];

const argsWithValue = {
  'call-id': callId,
  'user-count': userCount,
  duration: duration,
  'show-window': showWindow,
};
const argsWithNoValue = { camera: camera, mic: mic };

Object.keys(argsWithValue).map((key) => {
  if (!argsWithValue[key]) {
    return;
  }
  params.push(`--${key} ${argsWithValue[key]}`);
});

Object.keys(argsWithNoValue).map((key) => {
  if (argsWithNoValue[key] !== 'true') {
    return;
  }
  params.push(`--${key}`);
});

http.post('http://localhost:7654/terminal', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: `stream-video-buddy join ${params.join(' ')}`,
  }),
});
