const params = [];

const argsWithValue = {
  'call-id': call_id,
  'user-count': user_count,
  duration: duration,
  'show-window': show_window,
};
const argsWithNoValue = {camera: camera, mic: mic};

Object.keys(argsWithValue).map(key => {
  if (!argsWithValue[key]) {
    return;
  }
  params.push(`--${key} ${argsWithValue[key]}`);
});

Object.keys(argsWithNoValue).map(key => {
  if (argsWithNoValue[key] !== 'true') {
    return;
  }
  params.push(`--${key}`);
});

http.post('http://localhost:7654/terminal', {
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    command: `stream-video-buddy join ${params.join(' ')}`,
  }),
});
