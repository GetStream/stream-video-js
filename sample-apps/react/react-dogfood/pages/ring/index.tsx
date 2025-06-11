import { DialerPage } from '../../components/Dialer/DialerPage';
import { getServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';

export default DialerPage;

export const getServerSideProps = getServerSideCredentialsProps;
