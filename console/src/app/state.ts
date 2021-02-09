import { createStore } from '@stencil/store';
import { AnnounceState } from './datatypes';

interface State {
  signIn: boolean;
  announces: AnnounceState[];
}

const store = createStore<State>({ signIn: false, announces: [] });

export class AppState {
  readonly state = store.state as Readonly<State>;

  updateSignIn(v: boolean) {
    store.state.signIn = v;
  }
  updateAnnounces(announces: AnnounceState[]) {
    store.state.announces = announces;
  }
}
