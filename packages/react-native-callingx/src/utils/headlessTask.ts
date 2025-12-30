import { AppRegistry } from 'react-native';

export const HEADLESS_TASK_NAME = 'HandleIncomingCall';

export type ManagableTask = (
  taskData: any,
  stopTask: () => void
) => Promise<void>;

type HeadlessTask = (taskData: any) => Promise<void>;

export const defaultBackgroundTask: ManagableTask = (
  taskData: any,
  stopTask: () => void
) => {
  return new Promise<void>((resolve) => {
    console.log('Default background task data', taskData);
    let i = 0;
    const totalIterations = 5;

    function loop() {
      if (i < totalIterations) {
        setTimeout(() => {
          console.log(`Iteration: ${i + 1}`);
          i++;
          loop();
        }, 1000);
      } else {
        console.log('Default background task finished');
        resolve(undefined);
        stopTask();
      }
    }

    loop();
  });
};

let headlessTask: HeadlessTask = (taskData: any) =>
  defaultBackgroundTask(taskData, () => {
    console.log('Cancel callback called');
  });

export const setHeadlessTask = (task: HeadlessTask) => {
  headlessTask = task;
};

export const registerHeadlessTask = () => {
  AppRegistry.registerHeadlessTask(HEADLESS_TASK_NAME, () => {
    return headlessTask;
  });
};
