import UserList from '../user-list/UserList';
import icon from '../../assets/icon.png';

export default function Login(): JSX.Element {
  return (
    <section className="login-screen">
      <div className="intro-area">
        <img src={icon} alt="Logo" />
        <h1>Audio rooms</h1>
        <h2 className="secondaryText">Drop-in audio chat</h2>
        <p className="secondaryText">
          Feel free to test out the Stream Video SDK with our Audio example
          right inside of your browser.
        </p>
      </div>
      <UserList />
    </section>
  );
}
