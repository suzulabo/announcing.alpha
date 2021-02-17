import {
  AnnounceConverter,
  AnnounceMetaConverter,
  PostConverter,
  UserConverter,
} from 'announsing-shared';
import * as crypto from 'crypto';
import * as admin from 'firebase-admin';

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

const toHash = (...args: (string | undefined)[]) => {
  const md5 = crypto.createHash('md5');
  return md5
    .update(serialize(...args))
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '.')
    .substr(0, 8);
};

export const announceMetaHash = (v: AnnounceMeta_FS) => {
  return toHash(v.name, v.desc, v.link, v.icon);
};

// testing
export const _serialize = serialize;
