import {
  AnnounceConverter,
  AnnounceMetaConverter,
  PostConverter,
  UserConverter,
} from 'announsing-shared';
import * as admin from 'firebase-admin';
import { toMD5Base62 } from './utils';

import FieldValue = admin.firestore.FieldValue;

export const converters = {
  announce: new AnnounceConverter<FieldValue>(),
  announceMeta: new AnnounceMetaConverter<FieldValue>(),
  post: new PostConverter<FieldValue>(),
  user: new UserConverter<FieldValue>(),
};

export type Announce_FS = AnnounceConverter<FieldValue>['fsType'];
export type AnnounceMeta_FS = AnnounceMetaConverter<FieldValue>['fsType'];
export type Post_FS = PostConverter<FieldValue>['fsType'];
export type User_FS = UserConverter<FieldValue>['fsType'];

const serialize = (...args: (string | undefined)[]) => {
  return args
    .map(v => (!v ? '' : v))
    .join('\0')
    .replace(/\0+$/, '');
};

export const announceMetaHash = (v: AnnounceMeta_FS) => {
  return toMD5Base62(serialize(v.name, v.desc, v.link, v.icon)).substr(0, 8);
};

export const postHash = (v: Post_FS) => {
  return toMD5Base62(serialize(v.title, v.body, v.link, v.img)).substr(0, 8);
};

export const checkOwner = async (firestore: admin.firestore.Firestore, uid: string, id: string) => {
  const userRef = firestore.doc(`users/${uid}`).withConverter(converters.user);
  const userData = (await userRef.get()).data();
  if (!userData) {
    console.warn('no user', uid);
    return false;
  }
  if (!userData.announces || userData.announces.indexOf(id) < 0) {
    console.warn('not owner', uid, id);
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
