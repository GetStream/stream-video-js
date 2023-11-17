import {
  AxiosRequestTransformer,
  AxiosResponseTransformer,
  default as axios,
} from 'axios';
import { JoinCallResponse } from '@stream-io/video-react-sdk';

const cascadingTransformer: AxiosRequestTransformer =
  /**
   * This transformer is used to enable forwarding of cascading mode params
   * to the backend.
   *
   * Note: it needs to be declared as a `function` instead of an arrow function
   * as it executes in the context of the current axios instance.
   */
  function cascadingTransformer(data: any) {
    const getCascadingModeParams = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const cascadingEnabled = params.get('cascading') !== null;
        if (cascadingEnabled) {
          const rawParams: Record<string, string> = {};
          params.forEach((value, key) => {
            rawParams[key] = value;
          });
          return rawParams;
        }
      }
      return null;
    };

    const cascadingModeParams = getCascadingModeParams();
    if (cascadingModeParams) {
      this.params = {
        ...this.params,
        ...cascadingModeParams,
      };
    }
    return data;
  };

const sfuOverrideTransformer: AxiosResponseTransformer =
  /**
   * This transformer is used to override the SFU URL and WS URL returned by the
   * backend with the ones provided in the URL query params.
   *
   * Useful for testing with a local SFU.
   *
   * Note: it needs to be declared as a `function` instead of an arrow function
   * as it executes in the context of the current axios instance.
   */
  function sfuOverrideTransformer(data) {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sfuUrlOverride = params.get('sfuUrl');
      const sfuWsUrlOverride = params.get('sfuWsUrl');
      if (sfuUrlOverride && sfuWsUrlOverride && this.url?.endsWith('/join')) {
        (data as JoinCallResponse).credentials.server = {
          ...(data as JoinCallResponse).credentials.server,
          url: sfuUrlOverride,
          ws_endpoint: sfuWsUrlOverride,
          edge_name: sfuUrlOverride,
        };
      }
    }
    return data;
  };

/**
 * Default request transformers.
 */
export const defaultRequestTransformers: AxiosRequestTransformer[] = [
  cascadingTransformer,
  ...(axios.defaults.transformRequest as AxiosRequestTransformer[]),
];

/**
 * Default response transformers.
 */
export const defaultResponseTransformers: AxiosResponseTransformer[] = [
  ...(axios.defaults.transformResponse as AxiosResponseTransformer[]),
  sfuOverrideTransformer,
];
