/** Android: `pages/LoginPage.kt`. */
export const LoginPage = {
  get randomUserSignInButton() {
    return by.id('random-user-sign-in');
  },
  get emailSignIn() {
    return by.id('email-sign-in');
  },
  get emailInputField() {
    return by.id('email-input-field');
  },
  get loginButton() {
    return by.id('login-button');
  },
};
