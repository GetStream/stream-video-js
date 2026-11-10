(function () {
  if (window.__androidConsoleMirrorInstalled) return;
  window.__androidConsoleMirrorInstalled = true;
  var bridge = window.streamHostBridge;
  if (!bridge) return;
  var levels = ['log', 'warn', 'error', 'info', 'debug'];
  var fmt = function (a) {
    try {
      if (a === undefined) return 'undefined';
      if (a === null) return 'null';
      if (typeof a === 'string') return a;
      if (a instanceof Error)
        return a.name + ': ' + a.message + (a.stack ? '\n' + a.stack : '');
      return JSON.stringify(a);
    } catch (e) {
      try {
        return String(a);
      } catch (_) {
        return '[unserializable]';
      }
    }
  };
  levels.forEach(function (level) {
    var original = console[level]
      ? console[level].bind(console)
      : function () {};
    console[level] = function () {
      try {
        var args = Array.prototype.slice.call(arguments).map(fmt);
        bridge.postMessage(
          JSON.stringify({ type: 'console', level: level, args: args }),
        );
      } catch (_) {}
      original.apply(null, arguments);
    };
  });
})();
