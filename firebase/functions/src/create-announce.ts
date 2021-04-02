import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { announceMetaHash, AnnounceMeta_FS, Announce_FS, User_FS } from './firestore';
import { AnnounceMetaRule, CreateAnnounceParams } from './shared';
import { autoID } from './utils';

export const callCreateAnnounce = async (
  params: CreateAnnounceParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  return createAnnounce(params, uid, adminApp);
};

const createAnnounce = async (
  params: CreateAnnounceParams,
  uid: string | undefined,
  adminApp: admin.app.App,
): Promise<void> => {
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

  const metaData: AnnounceMeta_FS = {
    name,
    ...(!!desc && { desc }),
    cT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const id = autoID();
  const mid = announceMetaHash(metaData);

  const announceData: Announce_FS = {
    mid,
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };
  const userData: User_FS = {
    announces: admin.firestore.FieldValue.arrayUnion(id),
  };

  const firestore = adminApp.firestore();
  const batch = firestore.batch();
  batch.create(firestore.doc(`announces/${id}`), announceData);
  batch.create(firestore.doc(`announces/${id}/meta/${mid}`), metaData);
  batch.set(firestore.doc(`users/${uid}`), userData, { merge: true });
  await batch.commit();
  console.log('CREATE ANNOUNCE', announceData, metaData);
};
