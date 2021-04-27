import * as admin from 'firebase-admin';
import { Announce, AnnounceMeta } from '../shared';
import { converters } from './firestore';

type Miss = {};
export const MISS: Miss = {};

export class Cache<T extends object> {
  constructor(private m = new Map<string, WeakRef<T | Miss>>()) {}
  set(k: string, v: T | Miss) {
    this.m.set(k, new WeakRef(v));
  }
  get(k: string): T | Miss | undefined {
    const ref = this.m.get(k);
    if (!ref) {
      return;
    }
    const v = ref.deref();
    if (!v) {
      this.m.delete(k);
    }
    return v;
  }
}

import Firestore = admin.firestore.Firestore;

const _cache = async <T>(
  m: Map<string, T | undefined>,
  k: string,
  c: () => Promise<T | undefined>,
) => {
  if (m.has(k)) {
    return m.get(k) as T;
  }
  const v = await c();
  m.set(k, v);
  return v;
};

const _announceMap = new Map<string, Announce | undefined>();
export const announceCache = (id: string, firestore: Firestore) => {
  return _cache(_announceMap, id, async () => {
    return (await firestore.doc(`announces/${id}`).withConverter(converters.announce).get()).data();
  });
};

const _announceMetaMap = new Map<string, AnnounceMeta | undefined>();
export const announceMetaCache = (id: string, mid: string, firestore: Firestore) => {
  return _cache(_announceMetaMap, `${id}/${mid}`, async () => {
    return (
      await firestore
        .doc(`announces/${id}/meta/${mid}`)
        .withConverter(converters.announceMeta)
        .get()
    ).data();
  });
};
