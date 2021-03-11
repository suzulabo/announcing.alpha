import { createStore } from '@stencil/store';

interface State {
  loading: boolean;
}

const store = createStore<State>({
  loading: false,
});

export class AppState {
  readonly state = store.state as Readonly<State>;

  updateLoading(v: boolean) {
    store.state.loading = v;
  }
}
