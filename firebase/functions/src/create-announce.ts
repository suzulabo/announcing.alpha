import { autoID, CreateAnnounceParams } from 'announsing-shared';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { fsHelper } from './firestore';

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
  if (!params.name) {
    throw new Error('missing name');
  }
  if (params.name.length > 50) {
    throw new Error('name is too long');
  }
  if (params.desc && params.desc.length > 500) {
    throw new Error('desc is too long');
  }

  const id = autoID();
  const mid = '0';

  const data = {
    id,
    users: { [uid]: { own: true } },
    mid,
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const dataMeta = {
    name: params.name.trim(),
    ...(!!params.desc && { desc: params.desc.trim() }),
    cT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const firestore = adminApp.firestore();
  const batch = firestore.batch();
  fsHelper.announce.createTB(batch, firestore.doc(`announces/${id}`), data);
  fsHelper.announceMeta.createTB(batch, firestore.doc(`announces/${id}/meta/${mid}`), dataMeta);
  await batch.commit();
  console.log('CREATE ANNOUNCE', data, dataMeta);
};
