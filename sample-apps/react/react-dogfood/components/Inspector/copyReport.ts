export async function copyReport() {
  let report = '';
  document.querySelectorAll('[data-copy], [data-copyable]').forEach((el) => {
    if (el instanceof HTMLElement) {
      const line = el.dataset['copy'] ?? el.textContent?.trim() ?? '';
      report += `${el.dataset['h'] && report ? '\n' : ''}${line}${el.dataset['label'] ? ': ' : '\n'}`;

      if (el.dataset['h']) {
        report += '='.repeat(line.length) + '\n';
      }
    }
  });
  await navigator.clipboard.writeText(report);
}
