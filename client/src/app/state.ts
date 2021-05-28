import { createStore } from '@stencil/store';
import { AnnounceState, DataResult } from './datatypes';

const store = createStore<{ [k: string]: unknown }>({});

export class AppState {
  announce = {
    set: (id: string, v: DataResult<AnnounceState>) => {
      // check same value or not
      const cur = this.announce.get(id);
      b: {
        if (
          cur?.state == 'SUCCESS' &&
          v.state == 'SUCCESS' &&
          cur.value.uT.toMillis() != v.value.uT.toMillis()
        ) {
          break b;
        }
        if (cur?.state != v.state) {
          break b;
        }
        return;
      }

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
