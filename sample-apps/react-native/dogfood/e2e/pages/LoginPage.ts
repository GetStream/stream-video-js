/** The dogfood app's login screen (`src/screens/LoginScreen`), testIDs from `src/constants/TestIds.ts`. */
export const LoginPage = {
  get userNameInputField() {
    return by.id('login-user-name-input');
  },
  get loginButton() {
    return by.id('login-button');
  },
};
