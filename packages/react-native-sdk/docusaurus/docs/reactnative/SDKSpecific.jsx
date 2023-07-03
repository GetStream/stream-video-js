import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const SDKSpecific = ({ children, name = 'angular' }) => (
  <BrowserOnly>
    {() => (window.location.pathname.includes(`/${name}/`) ? children : null)}
  </BrowserOnly>
);

export default SDKSpecific;
