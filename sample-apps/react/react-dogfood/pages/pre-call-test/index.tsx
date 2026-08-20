import PreCallTestApp from '../../components/PreCallTest/PreCallTestApp';
import { getServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';

export default PreCallTestApp;

export const getServerSideProps = getServerSideCredentialsProps;
