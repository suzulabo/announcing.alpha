import { createStore } from '@stencil/store';
import { AnnounceState, DataResult } from './datatypes';

const store = createStore<{ [k: string]: unknown }>({});

export class AppState {
  announce = {
    set: (id: string, v: DataResult<AnnounceState>) => {
      store.set(`announce.${id}`, v);
    },
    get: (id: string) => {
      return store.get(`announce.${id}`) as DataResult<AnnounceState> | undefined;
    },
    delete: (id: string) => {
      delete store.state[`announce.${id}`];
    },
  };
}
