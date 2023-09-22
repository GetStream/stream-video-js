import { createRoot } from 'react-dom/client';
import {
  ConfigurationContext,
  ConfigurationValue,
  applyConfigurationDefaults,
} from './ConfigurationContext';
import { CompositeApp } from './CompositeApp';

import '@stream-io/video-react-sdk/dist/css/styles.css';

// @ts-expect-error TODO: this is a global function, we need to declare it
window.setupLayout = (configuration: ConfigurationValue) => {
  const newConfiguration = applyConfigurationDefaults(configuration);
  console.log('Mounting with config:', { configuration: newConfiguration });

  createRoot(document.getElementById('root') as HTMLElement).render(
    <ConfigurationContext.Provider value={newConfiguration}>
      <CompositeApp />
    </ConfigurationContext.Provider>,
  );
};

/**
(() => {
  const v = document.createElement('script');
  v.innerHTML = `window.setupLayout(${JSON.stringify({
    call_id: '<call_id>',
    layout: 'grid',
    screenshare_layout: 'spotlight',
    ext_css: 'https://github.githubassets.com/assets/light-983b05c0927a.css',
    options: {
      'title.text': 'Hey Streamers!',
      'logo.image_url':
        'https://theme.zdassets.com/theme_assets/9442057/efc3820e436f9150bc8cf34267fff4df052a1f9c.png',
      'layout.background_color': 'red',
      'video.background_color': 'green',
      'video.scale_mode': 'contain',
      'video.screenshare_scale_mode': 'contain',
      'participant_label.border_color': '#fff',
      'participant_label.border_width': '3px',
      'participant_label.border_radius': 'px',
      'participant_label.background_color': '#ddd',
      'participant_label.text_color': 'darkblue',
    },
  } satisfies Partial<ConfigurationValue>)});`;
  document.head.appendChild(v);
})();
*/
