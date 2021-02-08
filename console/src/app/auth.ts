import { AppFirebase } from './firebase';
import { AppState } from './state';

export class AppAuth {
  constructor(private appFirebase: AppFirebase, private appState: AppState) {}

  updateAuthState() {
    this.appState.updateSignIn(this.appFirebase.user != null);
  }

  readonly signIn = {
    google: async () => {
      await this.appFirebase.signInGoogle();
    },
  };

  async signOut() {
    await this.appFirebase.signOut();
    this.updateAuthState();
  }
}
