import * as admin from 'firebase-admin';
import { Announce, AnnounceMeta } from '../shared';
import { converters } from './firestore';

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
