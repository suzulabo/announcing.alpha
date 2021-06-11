import { createStore } from '@stencil/store';
import { DataResult, User } from 'src/shared';
import { AnnounceState } from './datatypes';

const store = createStore<Record<string, unknown>>({});

export class AppState {
  signIn = {
    set: (v: boolean) => {
      store.set('signIn', v);
    },
    get: () => {
      return store.get('signIn') as boolean;
    },
  };

  user = {
    set: (v: User) => {
      store.set('user', v);
    },
    get: () => {
      return store.get('user') as User | undefined;
    },
  };

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
      store.set(`announce.${id}`, undefined);
    },
  };
}
