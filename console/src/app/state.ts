import { createStore } from '@stencil/store';
import { User } from 'src/shared';
import { AnnounceState } from './datatypes';

interface State {
  loading: boolean;
  signIn: boolean;
  user: User;
  announces: Map<string, AnnounceState>;
}

const store = createStore<State>({
  loading: false,
  signIn: false,
  user: null,
  announces: new Map(),
});

export class AppState {
  readonly state = store.state;
}
