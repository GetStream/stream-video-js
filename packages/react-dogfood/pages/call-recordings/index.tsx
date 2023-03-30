import { CallRecordingsPage } from '../../components/CallRecordingsPage';
import { getServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';

export default CallRecordingsPage;

export const getServerSideProps = getServerSideCredentialsProps;
