// Do not modify this file manually. Instead, edit worker.ts
// and the run ./generate-timer-worker.sh
export const timerWorker = {
  src: `const timerIdMapping = new Map();
self.addEventListener('message', (event) => {
    const request = event.data;
    switch (request.type) {
        case 'setTimeout':
        case 'setInterval':
            timerIdMapping.set(request.id, (request.type === 'setTimeout' ? setTimeout : setInterval)(() => {
                tick(request.id);
                if (request.type === 'setTimeout') {
                    timerIdMapping.delete(request.id);
                }
            }, request.timeout));
            break;
        case 'clearTimeout':
        case 'clearInterval':
            (request.type === 'clearTimeout' ? clearTimeout : clearInterval)(timerIdMapping.get(request.id));
            timerIdMapping.delete(request.id);
            break;
    }
});
function tick(id) {
    const message = { type: 'tick', id };
    self.postMessage(message);
}`,
};
