type Callback = () => Promise<void>;

type PushLogoutCallbacks = {
  current?: Callback[];
};

let pushLogoutCallbacks: PushLogoutCallbacks = {};

export const setPushLogoutCallback = (callback: Callback) => {
  if (!pushLogoutCallbacks.current) {
    pushLogoutCallbacks.current = [callback];
  } else {
    pushLogoutCallbacks.current.push(callback);
  }
};

export default pushLogoutCallbacks;
