import { createStore } from '@stencil/store';
import { AnnounceState, FetchError, Follow, NotFound } from './datatypes';

interface State {
  announces: Map<string, AnnounceState | NotFound | FetchError>;
  follows: Follow[];
}

const store = createStore<State>({
  announces: new Map(),
  follows: [],
});

export class AppState {
  readonly state = store.state;
}
