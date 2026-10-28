(function () {
  if (window.__androidErrorCaptureInstalled) return;
  window.__androidErrorCaptureInstalled = true;
  var bridge = window.streamHostBridge;
  if (!bridge) return;
  var post = function (payload) {
    try {
      payload.type = 'error';
      bridge.postMessage(JSON.stringify(payload));
    } catch (_) {}
  };
  window.addEventListener('error', function (e) {
    post({
      kind: 'window.error',
      message: (e && e.message) || String(e),
      source: (e && e.filename + ':' + e.lineno + ':' + e.colno) || '',
      stack: (e && e.error && e.error.stack) || '',
    });
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = (e && e.reason) || {};
    post({
      kind: 'unhandledrejection',
      message: (r && (r.message || String(r))) || '',
      source: '',
      stack: (r && r.stack) || '',
    });
  });
})();
