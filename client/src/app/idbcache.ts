import { IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'announcing-idb-cache';
const STORE_NAME = 'cache';

export class AppIdbCache {
  private db: IDBPDatabase;

  async init() {
    this.db = await openDB(DB_NAME, 1, {
      upgrade: db => {
        db.createObjectStore(STORE_NAME);
      },
    });
  }

  async get<T>(k: string) {
    return (await this.db.get(STORE_NAME, k)) as T;
  }

  async set<T>(k: string, v: T) {
    await this.db.put(STORE_NAME, v, k);
  }
}
