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

// testing
export const _serialize = serialize;
