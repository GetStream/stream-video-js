import { DialerPage } from '../../components/Ringing/DialerPage';
import { getServerSideCredentialsPropsWithOptions } from '../../lib/getServerSideCredentialsProps';

export default DialerPage;

export const getServerSideProps = getServerSideCredentialsPropsWithOptions({
  signInAutomatically: true,
});
