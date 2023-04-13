import { Header } from './Header';

import * as data from './Header.data';

export default {
  component: Header,
  subcomponents: {},
  title: 'Header',
};

export const KichinSink = (props: any) => <Header {...props}></Header>;

KichinSink.args = {
  ...data.KichinSink,
};
