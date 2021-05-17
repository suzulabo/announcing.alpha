import { createStore } from '@stencil/store';
import { User } from 'src/shared';
import { AnnounceState } from './datatypes';

interface State {
  signIn: boolean;
  user: User;
  announces: Map<string, AnnounceState>;
}

const store = createStore<State>({
  signIn: false,
  user: null,
  announces: new Map(),
});

export class AppState {
  readonly state = store.state;
}
