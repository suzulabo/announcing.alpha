import { Plugins } from '@capacitor/core';
import { Follow } from './datatypes';

const { Storage } = Plugins;

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
        entries.push([key, await x.get(key)]);
      }
      return entries;
    },
  };
  return x;
};

export class AppStorage {
  readonly fcmToken = kvGetSet('fcmToken');
  readonly signKeys = objectGetSet<{ deviceID: string; secKey: string; pubKey: string }>('signKey');
  readonly follows = objectMulti<Follow>('follows.');
}