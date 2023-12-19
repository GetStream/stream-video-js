/**
 * Provides information to our users on how to delete their account.
 */
export default function DeleteAccountPage() {
  return (
    <main className="rt__delete-account">
      <h1>Account Deletion Request</h1>
      <p>
        We're sorry to see you go. If you would like to delete your account,
        please send an email to the following address:{' '}
        <a href="mailto:privacy@getstream.io">privacy@getstream.io</a>.
      </p>
      <p>In your email, please include the following information:</p>
      <ul>
        <li>Subject Line: Account Deletion Request</li>
        <li>The email address associated with your account</li>
        <li>Any additional details you think are relevant to your request</li>
      </ul>
      <p>
        Once we receive your email, our team will process your request as soon
        as possible. Please note that account deletion is irreversible and will
        result in the permanent loss of your account data.
      </p>
      <p>
        If you have any questions or need further assistance, please don't
        hesitate to contact our support team at{' '}
        <a href="mailto:privacy@getstream.io">privacy@getstream.io</a>.
      </p>
      <br />
      <p>Thank you for using our services,</p>
      <p>Stream team.</p>
    </main>
  );
}
