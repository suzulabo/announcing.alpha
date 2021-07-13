import { IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'announcing-idb-cache';
const STORE_NAME = 'cache';

export class AppIdbCache {
  private db?: IDBPDatabase;

  async init() {
    // It's can hang in Safari
    // https://bugs.webkit.org/show_bug.cgi?id=226547
    openDB(DB_NAME, 1, {
      upgrade: db => {
        db.createObjectStore(STORE_NAME);
      },
    }).then(db => {
      this.db = db;
    });
  }

  async get<T>(k: string) {
    if (this.db) {
      return (await this.db.get(STORE_NAME, k)) as T;
    }
    return;
  }

  async set<T>(k: string, v: T) {
    if (this.db) {
      await this.db.put(STORE_NAME, v, k);
    }
    return;
  }
}
