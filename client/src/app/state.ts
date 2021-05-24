import { createStore } from '@stencil/store';
import { AnnounceState, DataResult, Follow } from './datatypes';

interface State {
  announces: Map<string, DataResult<AnnounceState>>;
  follows: Follow[];
}

const store = createStore<State>({
  announces: new Map(),
  follows: [],
});

export class AppState {
  readonly state = store.state;
}
