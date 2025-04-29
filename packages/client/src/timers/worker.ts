import type { TimerWorkerEvent, TimerWorkerRequest } from './types';

const timerIdMapping = new Map<number, NodeJS.Timeout>();

self.addEventListener('message', (event: MessageEvent) => {
  const request = event.data as TimerWorkerRequest;

  switch (request.type) {
    case 'setTimeout':
    case 'setInterval':
      timerIdMapping.set(
        request.id,
        (request.type === 'setTimeout' ? setTimeout : setInterval)(() => {
          tick(request.id);

          if (request.type === 'setTimeout') {
            timerIdMapping.delete(request.id);
          }
        }, request.timeout),
      );
      break;

    case 'clearTimeout':
    case 'clearInterval':
      (request.type === 'clearTimeout' ? clearTimeout : clearInterval)(
        timerIdMapping.get(request.id),
      );
      timerIdMapping.delete(request.id);
      break;
  }
});

function tick(id: number) {
  const message: TimerWorkerEvent = { type: 'tick', id };
  self.postMessage(message);
}
