import { createStore } from '@stencil/store';
import { AnnounceState } from './datatypes';

interface State {
  loading: boolean;
  announces: Map<string, AnnounceState>;
}

const store = createStore<State>({
  loading: false,
  announces: new Map(),
});

export class AppState {
  readonly state = store.state;
}
