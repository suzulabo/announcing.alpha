import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { AnnounceMetaRule, CreateAnnounceParams } from '../shared';
import { announceMetaHash } from '../utils/firestore';
import { logger } from '../utils/logger';
import { autoID } from '../utils/util';

export const callCreateAnnounce = async (
  params: Partial<CreateAnnounceParams>,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new Error('missing uid');
  }
  const { name, desc } = params;
  if (!name) {
    throw new Error('missing name');
  }
  if (name.length > AnnounceMetaRule.name.length) {
    throw new Error('name is too long');
  }
  if (desc && desc.length > AnnounceMetaRule.desc.length) {
    throw new Error('desc is too long');
  }

  const metaData = {
    name,
    ...(!!desc && { desc }),
    cT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const id = autoID();
  const mid = announceMetaHash(metaData);

  const announceData = {
    mid,
    posts: {},
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };
  const userData = {
    announces: admin.firestore.FieldValue.arrayUnion(id),
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const firestore = adminApp.firestore();
  const batch = firestore.batch();
  batch.create(firestore.doc(`announces/${id}`), announceData);
  batch.create(firestore.doc(`announces/${id}/meta/${mid}`), metaData);
  batch.set(firestore.doc(`users/${uid}`), userData, { merge: true });
  await batch.commit();
  logger.info('CREATE ANNOUNCE', { announceData, metaData });
};
