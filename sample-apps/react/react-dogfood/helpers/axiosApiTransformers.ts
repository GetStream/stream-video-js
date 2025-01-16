import {
  AxiosRequestTransformer,
  AxiosResponseTransformer,
  default as axios,
} from 'axios';
import {
  GetOrCreateCallResponse,
  JoinCallRequest,
  JoinCallResponse,
} from '@stream-io/video-react-sdk';

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

const generalLocationOverrideTransformer: AxiosRequestTransformer =
  /**
   * This transformer is used to override the general location returned determined
   * by the SDK with a random location from the list of IATA codes.
   *
   * Note: it needs to be declared as a `function` instead of an arrow function
   * as it executes in the context of the current axios instance.
   */
  function generalLocationOverrideTransformer(data) {
    if (
      typeof window === 'undefined' ||
      !this.url?.endsWith('/join') ||
      process.env.NEXT_PUBLIC_ENABLE_LOCATION_RANDOMIZATION !== 'true'
    ) {
      return data;
    }

    // prettier-ignore
    const iataCodes = [
      // North America
      'ATL', 'BOS', 'BWI', 'CLT', 'DEN', 'DFW', 'DTW', 'EWR', 'IAH', 'IAD',
      'JFK', 'LAS', 'LAX', 'LGA', 'MCO', 'MEX', 'MIA', 'MSP', 'ORD', 'PDX',
      'PHL', 'PHX', 'PIT', 'SAN', 'SEA', 'SFO', 'SLC', 'TPA', 'YUL', 'YVR',
      // South America
      'AEP', 'AFA', 'ASU', 'BEL', 'BGI', 'BRC', 'BSB', 'CCS', 'CLO', 'CNF',
      'CPT', 'CUN', 'DAC', 'EZE', 'FOR', 'GYE', 'GIG', 'GRU', 'LIM', 'LPB',
      'MVD', 'RIO', 'RUH', 'SAL', 'SCL', 'SJO', 'SSA', 'UIO', 'VCP', 'VVI',
      // Europe
      'AMS', 'ATH', 'BCN', 'BGO', 'BLL', 'BRU', 'BUD', 'CDG', 'CPH', 'DUB',
      'FRA', 'HEL', 'IST', 'LED', 'LHR', 'LIS', 'LUX', 'MAD', 'MUC', 'MXP',
      'OSL', 'PRG', 'RUH', 'SKP', 'SOF', 'VIE', 'WAW', 'ZAG', 'ZRH',
      // Asia
      'AMM', 'BKK', 'CAN', 'CCU', 'CGK', 'DEL', 'DOH', 'DXB', 'HKG', 'HND',
      'ICN', 'KIX', 'KUL', 'PEK', 'PVG', 'SGN', 'SIN', 'TPE',
      // Africa
      'ACC', 'CAI', 'JNB', 'LOS', 'NBO', 'CMN', 'ADD', 'DKR', 'CPT', 'TUN',
      // Australia
      'ADL', 'AKL', 'BNE', 'CHC', 'DUD', 'MEL', 'PER', 'SYD', 'WLG', 'ZQN'
    ];

    const randomLocation =
      iataCodes[Math.floor(Math.random() * iataCodes.length)];

    console.log(`Overriding location: ${data.location} with ${randomLocation}`);

    (data as JoinCallRequest).location = randomLocation;
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

const targetResolutionOverrideTransformer: AxiosResponseTransformer =
  /**
   * This transformer is used to override the target resolution returned by the
   * backend with the one provided in the URL query params.
   *
   * Useful for testing with a specific target resolution.
   *
   * Note: it needs to be declared as a `function` instead of an arrow function
   * as it executes in the context of the current axios instance.
   */
  function targetResolutionOverrideTransformer(data: GetOrCreateCallResponse) {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const width = params.get('width') || params.get('w');
      const height = params.get('height') || params.get('h');
      if (width && height && data?.call?.settings?.video?.target_resolution) {
        data.call.settings.video.target_resolution = {
          ...data.call.settings.video.target_resolution,
          width: parseInt(width, 10),
          height: parseInt(height, 10),
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
  generalLocationOverrideTransformer,
  ...(axios.defaults.transformRequest as AxiosRequestTransformer[]),
];

/**
 * Default response transformers.
 */
export const defaultResponseTransformers: AxiosResponseTransformer[] = [
  ...(axios.defaults.transformResponse as AxiosResponseTransformer[]),
  sfuOverrideTransformer,
  targetResolutionOverrideTransformer,
];
