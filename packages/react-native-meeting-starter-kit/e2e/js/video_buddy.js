var params = [];

if (call_id) {
  params.push(`--call-id ${call_id}`);
}

if (user_count) {
  params.push(`--user-count ${user_count}`);
}

if (call_duration) {
  params.push(`--duration ${call_duration}`);
}

if (show_window) {
  params.push(`--show-window ${show_window}`);
}

// ...

http.post(`http://localhost:7654/terminal`, {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    command: `stream-video-buddy join ${params.join(' ')}`,
  }),
});
