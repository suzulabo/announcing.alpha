import { autoID, CreateAnnounceParams } from 'announsing-shared';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { announceMetaHash, AnnounceMeta_FS, Announce_FS } from './firestore';

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
  if (name.length > 50) {
    throw new Error('name is too long');
  }
  if (desc && desc.length > 500) {
    throw new Error('desc is too long');
  }

  const dataMeta: AnnounceMeta_FS = {
    name,
    ...(!!desc && { desc }),
    cT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const id = autoID();
  const mid = announceMetaHash(dataMeta);

  const data: Announce_FS = {
    id,
    users: { [uid]: { own: true } },
    mid,
    uT: admin.firestore.FieldValue.serverTimestamp(),
    del: false,
  };

  const firestore = adminApp.firestore();
  const batch = firestore.batch();
  batch.create(firestore.doc(`announces/${id}`), data);
  batch.create(firestore.doc(`announces/${id}/meta/${mid}`), dataMeta);
  await batch.commit();
  console.log('CREATE ANNOUNCE', data, dataMeta);
};
