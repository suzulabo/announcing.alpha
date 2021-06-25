import { Storage } from '@capacitor/storage';
import { createStore } from '@stencil/store';
import { ClientConfig, Follow } from './datatypes';

const kvGetSet = (key: string) => {
  return {
    get: async () => {
      return (await Storage.get({ key: key }))?.value;
    },
    set: (value: string) => {
      return Storage.set({ key: key, value: value });
    },
    remove: () => {
      return Storage.remove({ key: key });
    },
  };
};

const objectGetSet = <T>(key: string) => {
  return {
    get: async () => {
      const s = (await Storage.get({ key: key }))?.value;
      if (s) {
        return JSON.parse(s) as T;
      }
      return;
    },
    set: (value: T) => {
      return Storage.set({ key: key, value: JSON.stringify(value) });
    },
    remove: () => {
      return Storage.remove({ key: key });
    },
  };
};

const objectMulti = <T>(prefix: string) => {
  const x = {
    keys: async () => {
      return (await Storage.keys()).keys
        .filter(v => {
          return v.startsWith(prefix);
        })
        .map(v => {
          return v.replace(prefix, '');
        });
    },
    get: (key: string) => {
      return objectGetSet<T>(`${prefix}${key}`).get();
    },
    set: (key: string, value: T) => {
      return objectGetSet<T>(`${prefix}${key}`).set(value);
    },
    remove: (key: string) => {
      return objectGetSet<T>(`${prefix}${key}`).remove();
    },
    entries: async () => {
      const keys = await x.keys();
      const entries: [string, T][] = [];
      for (const key of keys) {
        const v = await x.get(key);
        if (v) {
          entries.push([key, v]);
        }
      }
      return entries;
    },
  };
  return x;
};

const objectGetSetState = <T>(key: string) => {
  const ogs = objectGetSet<T>(key);
  const store = createStore<{ v?: T }>({});

  const x = {
    init: async () => {
      store.set('v', await ogs.get());
    },
    get: () => {
      return store.get('v');
    },
    set: async (v: T) => {
      await ogs.set(v);
      store.set('v', { ...v });
    },
  };
  return x;
};

const objectMultiState = <T>(prefix: string) => {
  const om = objectMulti<T>(prefix);
  const store = createStore<Record<string, T | undefined>>({});

  const x = {
    init: async () => {
      (await om.entries()).map(([k, v]) => {
        store.set(k, v);
      });
    },
    get: (key: string) => {
      return store.get(key);
    },
    set: async (key: string, value: T) => {
      await om.set(key, value);
      store.set(key, { ...value });
    },
    remove: async (key: string) => {
      await om.remove(key);
      store.set(key, undefined);
    },
    keys: () => {
      return x.entries().map(([k]) => k);
    },
    entries: () => {
      return Object.entries(store.state).filter(([, v]) => v != undefined) as [string, T][];
    },
  };
  return x;
};

export class AppStorage {
  readonly fcmToken = kvGetSet('fcmToken');
  readonly signKey = kvGetSet('signKey');
  readonly follows = objectMultiState<Follow>('follows.');
  readonly notifications = objectMultiState<{
    x?: never; // no props now
  }>('notifications.');
  readonly config = objectGetSetState<ClientConfig>('config');

  init() {
    return Promise.all([this.follows.init(), this.notifications.init(), this.config.init()]);
  }
}
