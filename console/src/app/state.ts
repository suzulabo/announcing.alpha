import { createStore } from '@stencil/store';
import { AnnounceState } from './datatypes';

interface State {
  loading: boolean;
  signIn: boolean;
  announces: AnnounceState[];
}

const store = createStore<State>({ loading: false, signIn: false, announces: [] });

export class AppState {
  readonly state = store.state as Readonly<State>;

  updateLoading(v: boolean) {
    store.state.loading = v;
  }

  updateSignIn(v: boolean) {
    store.state.signIn = v;
  }
  updateAnnounces(announces: AnnounceState[]) {
    store.state.announces = announces;
  }
}
