import { AnnounceHelper, AnnounceMetaHelper, PostHelper } from 'announsing-shared';
import * as admin from 'firebase-admin';

import FieldValue = admin.firestore.FieldValue;

export const fsHelper = {
  announce: new AnnounceHelper<FieldValue>(),
  announceMeta: new AnnounceMetaHelper<FieldValue>(),
  post: new PostHelper<FieldValue>(),
};
