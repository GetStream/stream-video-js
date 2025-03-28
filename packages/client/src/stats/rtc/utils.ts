/**
 * transforms a maplike to an object. Mostly for getStats + JSON.parse(JSON.stringify())
 * @param {*} m
 */
export const map2obj = (m: Map<string, any>): Record<string, any> => {
  if (!m.entries) {
    return m;
  }
  const o = {};

  m.forEach((v, k) => {
    // @ts-expect-error types issue
    o[k] = v;
  });

  return o;
};

// apply a delta compression to the stats report. Reduces size by ~90%.
// To reduce further, report keys could be compressed.
export const deltaCompression = (
  oldStats: Record<any, any>,
  newStats: Record<any, any>,
) => {
  newStats = JSON.parse(JSON.stringify(newStats));
  Object.keys(newStats).forEach((id) => {
    const report = newStats[id];
    delete report.id;
    if (!oldStats[id]) {
      return;
    }
    Object.keys(report).forEach((name) => {
      if (report[name] === oldStats[id][name]) {
        delete newStats[id][name];
      }
      if (Object.keys(report).length === 0) {
        delete newStats[id];
      } else if (Object.keys(report).length === 1 && report.timestamp) {
        delete newStats[id];
      }
    });
  });

  let timestamp = -Infinity;
  Object.keys(newStats).forEach((id) => {
    const report = newStats[id];
    if (report.timestamp > timestamp) {
      timestamp = report.timestamp;
    }
  });
  Object.keys(newStats).forEach((id) => {
    const report = newStats[id];
    if (report.timestamp === timestamp) {
      report.timestamp = 0;
    }
  });
  newStats.timestamp = timestamp;
  return newStats;
};
