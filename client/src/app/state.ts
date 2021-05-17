import { createStore } from '@stencil/store';
import { AnnounceState, Follow } from './datatypes';

interface State {
  announces: Map<string, AnnounceState>;
  follows: Follow[];
}

const store = createStore<State>({
  announces: new Map(),
  follows: [],
});

export class AppState {
  readonly state = store.state;
}
