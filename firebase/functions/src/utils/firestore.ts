import * as admin from 'firebase-admin';
import { Merge } from 'type-fest';
import {
  Announce,
  AnnounceConverter,
  AnnounceMeta,
  AnnounceMetaConverter,
  Post,
  PostConverter,
  User,
  UserConverter,
} from '../shared';
import { logger } from '../utils/logger';
import { toMD5Base62 } from './util';

import FieldValue = admin.firestore.FieldValue;
import Timestamp = admin.firestore.Timestamp;

export type Announce_FS = Merge<
  Announce,
  { posts?: string[] | FieldValue; uT: Timestamp | FieldValue }
>;
export type AnnounceMeta_FS = Merge<AnnounceMeta, { cT: Timestamp | FieldValue }>;
export type Post_FS = Merge<Post, { pT: Timestamp | FieldValue }>;
export type User_FS = Merge<User, { announces: string[] | FieldValue }>;

export const converters = {
  announce: new AnnounceConverter(),
  announceMeta: new AnnounceMetaConverter(),
  post: new PostConverter(),
  user: new UserConverter(),
};

const serialize = (...args: (string | undefined)[]) => {
  return args
    .map(v => (!v ? '' : v))
    .join('\0')
    .replace(/\0+$/, '');
};

export const announceMetaHash = (v: AnnounceMeta_FS) => {
  return toMD5Base62(serialize(v.name, v.desc, v.link, v.icon)).substr(0, 8);
};

export const checkOwner = async (firestore: admin.firestore.Firestore, uid: string, id: string) => {
  const userRef = firestore.doc(`users/${uid}`).withConverter(converters.user);
  const userData = (await userRef.get()).data();
  if (!userData) {
    logger.warn('no user', uid);
    return false;
  }
  if (!userData.announces || userData.announces.indexOf(id) < 0) {
    logger.warn('not owner', { uid, id });
    return false;
  }
  return true;
};

export const storeImage = async (firestore: admin.firestore.Firestore, img: string) => {
  if (!img) {
    return;
  }
  const d = Buffer.from(img, 'base64');
  const imgID = toMD5Base62(d);
  const imgRef = firestore.doc(`images/${imgID}`);
  const doc = await imgRef.get();
  if (!doc.exists) {
    await imgRef.create({ d });
  }
  return imgID;
};

// testing
export const _serialize = serialize;
