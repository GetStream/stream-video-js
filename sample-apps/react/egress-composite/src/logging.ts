export function setupProxyLogging() {
  const methods = ['trace', 'debug', 'info', 'log', 'warn', 'error'] as const;
  methods.forEach((method) => {
    const original = console[method];
    console[method] = (...args: any[]) => {
      original.apply(console, args);
      const logString = `${method}: ${args.join(' ')}`.slice(0, 1024);
      fetch(`/log/${encodeURIComponent(logString)}`).catch(() => {});
    };
  });
}
