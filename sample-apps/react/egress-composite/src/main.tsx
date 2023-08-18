import { createRoot } from 'react-dom/client';
import {
  ConfigurationContext,
  extractPayloadFromToken,
} from './ConfigurationContext';
import { CompositeApp } from './CompositeApp';

import '@stream-io/video-react-sdk/dist/css/styles.css';

const DEFAULT_USER_ID = 'egress';
const DEFAULT_CALL_TYPE = 'default';

// @ts-ignore
window.StreamCompositeApp = {
  configureAndRender: (configuration: any) => {
    const {
      // apply defaults
      api_key = import.meta.env.VITE_STREAM_API_KEY,
      token = import.meta.env.VITE_STREAM_USER_TOKEN,
      user_id = extractPayloadFromToken(token as string)['user_id'] ??
        DEFAULT_USER_ID,
      call_type = DEFAULT_CALL_TYPE,
      options = {},
      ...rest
    } = configuration;

    const newConfiguration = {
      api_key,
      token,
      user_id,
      call_type,
      options,
      ...rest,
    };

    console.log('Mounting with config:', { configuration: newConfiguration });

    createRoot(document.getElementById('root') as HTMLElement).render(
      <ConfigurationContext.Provider value={newConfiguration}>
        <CompositeApp />
      </ConfigurationContext.Provider>,
    );
  },
};

(() => {
  const v = document.createElement('script');
  v.innerHTML = `window.StreamCompositeApp.configureAndRender({
    call_id: "0oPvqrMsyUMj",
    options: {
      layout: {
        main: "grid",
        mode: "shuffle"
      }
    }
  });`;
  document.head.appendChild(v);
})();
