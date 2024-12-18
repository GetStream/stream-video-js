import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';

import {
  applyConfigurationDefaults,
  ConfigurationContext,
  ConfigurationValue,
} from './ConfigurationContext';
import { CompositeApp } from './CompositeApp';

import '@stream-io/video-react-sdk/dist/css/styles.css';
// Uncomment this line to test your own custom CSS
// import cssUrl from '../public/example/custom.css?url';

if (import.meta.env.MODE === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_EGRESS_SENTRY_DNS,
    tracePropagationTargets: ['video-layout.getstream.io'],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      // Sentry.captureConsoleIntegration(),
    ],
    tracesSampleRate: 0.9,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    attachStacktrace: true,
    maxBreadcrumbs: 10,
  });
}

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

// Uncomment and tweak this setup script
/**
(async () => {
  const { apiKey, token } = await fetch(
    'https://pronto.getstream.io/api/auth/create-token?environment=pronto&user_id=egress',
  ).then((res) => res.json());
  const v = document.createElement('script');
  v.innerHTML = `window.setupLayout(${JSON.stringify({
    call_id: 'recording-test',
    call_type: 'default',
    api_key: apiKey,
    token,
    layout: 'single-participant',
    screenshare_layout: 'spotlight',
    // ext_css: cssUrl,
    options: {
      // 'grid.cell_padding': 0,
      // 'grid.columns': 5,
      // 'grid.margin': 0,
      // 'grid.position': 'bottom',
      // 'grid.rows': 1,
      // 'grid.screenshare_layout': 'spotlight',
      // 'grid.size_percentage': 0,
      // 'participant_label.border_rounded': false,
      // 'participant_label.display_border': false,
      // 'participant.video_border_color': '#000000',
      // 'participant.video_border_radius': '',
      // 'participant.video_border_rounded': false,
      // 'participant.video_border_width': false,
      // 'participant.video_highlight_border_color': '',
      'layout.background_color': 'black',
      'layout.background_image': '',
      'layout.background_position': '0 0, 0 0, 0 0, 0 0',
      'layout.background_repeat': 'repeat',
      'layout.background_size': '0 0',
      'layout.grid.gap': 0,
      'layout.grid.page_size': 16,
      'layout.single-participant.mode': 'default',
      'layout.single-participant.padding_block': 0,
      'layout.single-participant.padding_inline': '0%',
      'layout.single-participant.shuffle_delay': 0,
      'layout.size_percentage': 100,
      'layout.spotlight.participants_bar_limit': 5,
      'layout.spotlight.participants_bar_position': 'top',
      'logo.height': '',
      'logo.horizontal_position': 'center',
      'logo.image_url': '',
      'logo.margin_block': '.875rem',
      'logo.margin_inline': '',
      'logo.vertical_position': 'top',
      'logo.width': '',
      'participant_label.background_color': '#000000',
      'participant_label.border_color': '#000000',
      'participant_label.border_radius': 0,
      'participant_label.border_width': '0px',
      'participant_label.display': false,
      'participant_label.horizontal_position': 'left',
      'participant_label.text_color': '#000000',
      'participant_label.vertical_position': 'bottom',
      'participant.border_radius': 0,
      'participant.outline_color': '#000000',
      'participant.outline_width': '',
      'participant.placeholder_background_color': '',
      'title.color': '#000000',
      'title.font_size': '20px',
      'title.horizontal_position': 'center',
      'title.margin_block': 0,
      'title.margin_inline': 0,
      'title.text': '',
      'title.vertical_position': 'top',
      'video.background_color': '#000000',
      'video.scale_mode': 'fit',
      'video.screenshare_scale_mode': 'fit',
    },
  } satisfies Partial<ConfigurationValue>)});`;
  document.head.appendChild(v);
})();
*/
