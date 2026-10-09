import { describe, expect, it } from 'vitest';
import { ClientState } from '../ClientState';

describe('ClientState', () => {
  describe('API assertions', () => {
    it('every exposed observable$ should have a getter', () => {
      const state = new ClientState();
      const observables = Object.keys(
        Object.getOwnPropertyDescriptors(state),
      ).filter((key) => key.endsWith('$'));

      // the observables must stay own enumerable properties: consumers walk
      // `Object.entries(client.state)` to collect the current state.
      expect(observables).toContain('connectedUser$');
      expect(observables).toContain('calls$');

      // @ts-expect-error - __proto__
      const getters = Object.getOwnPropertyDescriptors(state.__proto__);

      for (const observable of observables) {
        const key = observable.slice(0, -1); // remove $
        const getter = getters[key];
        expect(
          getter,
          `A getter for ${observable} is missing. Please define it like this:
          get ${key}() {
            return getCurrentValue(this.${key}Subject);
          }
          `,
        ).toBeDefined();
        expect(typeof getter.get).toEqual('function');
      }
    });
  });
});
