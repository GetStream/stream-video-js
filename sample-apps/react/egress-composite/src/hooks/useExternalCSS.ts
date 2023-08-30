import { useEffect } from 'react';

import { useConfigurationContext } from '../ConfigurationContext';

export const useExternalCSS = () => {
  const { ext_css } = useConfigurationContext();

  useEffect(() => {
    if (!ext_css) return;

    const linkElement = document.createElement('link');

    linkElement.rel = 'stylesheet';
    linkElement.href = ext_css;
    linkElement.type = 'text/css';

    document.head.appendChild(linkElement);

    return () => {
      linkElement.remove();
    };
  }, [ext_css]);
};
