import { createRoot } from 'react-dom/client';
import {
  ConfigurationContext,
  ConfigurationValue,
  extractPayloadFromToken,
} from './ConfigurationContext';
import { CompositeApp } from './CompositeApp';

import '@stream-io/video-react-sdk/dist/css/styles.css';

const DEFAULT_USER_ID = 'egress';
const DEFAULT_CALL_TYPE = 'default';

// @ts-expect-error TODO: this is a global function, we need to declare it
window.setupLayout = (configuration: ConfigurationValue) => {
  const {
    // apply defaults
    api_key = import.meta.env.VITE_STREAM_API_KEY as string,
    token = import.meta.env.VITE_STREAM_USER_TOKEN as string,
    user_id = (extractPayloadFromToken(token as string)['user_id'] ??
      DEFAULT_USER_ID) as string,
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
};

// (() => {
//   const v = document.createElement('script');
//   v.innerHTML = `window.setupLayout({
//     call_id: "<call_id>",
//     layout: "grid",
//     screenshare_layout: "spotlight",
//     ext_css: "https://github.githubassets.com/assets/light-983b05c0927a.css",
//     options: {
//       "logo.image_url": "https://theme.zdassets.com/theme_assets/9442057/efc3820e436f9150bc8cf34267fff4df052a1f9c.png",
//     }
//   });`;
//   document.head.appendChild(v);
// })();
