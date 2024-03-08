/**
 * Flatten the stats report into an array of stats objects.
 *
 * @param report the report to flatten.
 */
export const flatten = (report: RTCStatsReport) => {
  const stats: RTCStats[] = [];
  report.forEach((s) => {
    stats.push(s);
  });
  return stats;
};
