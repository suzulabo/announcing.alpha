import * as admin from 'firebase-admin';
import { AnnounceMetaBase, Post, User } from '../shared';
import { logger } from '../utils/logger';
import { toMD5Base62 } from './util';

const serialize = (...args: (string | undefined)[]) => {
  return args
    .map(v => (!v ? '' : v))
    .join('\0')
    .replace(/\0+$/, '');
};

export const announceMetaHash = (v: AnnounceMetaBase) => {
  return toMD5Base62(serialize(v.name, v.desc, v.link, v.icon)).substr(0, 8);
};

export const postHash = (v: Post) => {
  return toMD5Base62(serialize(v.pT.toMillis().toString(), v.title, v.body, v.link, v.img)).substr(
    0,
    8,
  );
};

export const checkOwner = async (firestore: admin.firestore.Firestore, uid: string, id: string) => {
  const userRef = firestore.doc(`users/${uid}`);
  const userData = (await userRef.get()).data() as User;
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
  const data = Buffer.from(img, 'base64');
  const imgID = toMD5Base62(data);
  const imgRef = firestore.doc(`images/${imgID}`);
  const doc = await imgRef.get();
  if (!doc.exists) {
    await imgRef.create({ data });
  }
  return imgID;
};

// testing
export const _serialize = serialize;
