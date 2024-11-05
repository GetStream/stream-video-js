export type TimerWorkerRequest =
  | {
      type: 'setInterval' | 'setTimeout';
      id: number;
      timeout: number;
    }
  | {
      type: 'clearInterval' | 'clearTimeout';
      id: number;
    };

export type TimerWorkerEvent = {
  type: 'tick';
  id: number;
};
