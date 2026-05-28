(function () {
  if (window.__iosConsoleMirrorInstalled) return;
  window.__iosConsoleMirrorInstalled = true;
  var levels = ['log', 'warn', 'error', 'info', 'debug'];
  var bridge =
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.consoleBridge;
  if (!bridge) return;
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
        bridge.postMessage({ level: level, args: args });
      } catch (_) {}
      original.apply(null, arguments);
    };
  });
})();
