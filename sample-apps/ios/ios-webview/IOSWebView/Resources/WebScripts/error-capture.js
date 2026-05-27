(function () {
  if (window.__iosErrorCaptureInstalled) return;
  window.__iosErrorCaptureInstalled = true;
  var bridge =
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.errorBridge;
  if (!bridge) return;
  var post = function (payload) {
    try {
      bridge.postMessage(payload);
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
