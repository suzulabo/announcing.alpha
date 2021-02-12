import { DeleteAnnounceParams } from 'announsing-shared';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { Announce_FS, converters } from './firestore';

export const callDeleteAnnounce = async (
  params: DeleteAnnounceParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  return deleteAnnounce(params, uid, adminApp);
};

const deleteAnnounce = async (
  params: DeleteAnnounceParams,
  uid: string | undefined,
  adminApp: admin.app.App,
): Promise<void> => {
  if (!uid) {
    throw new Error('missing uid');
  }

  const { id } = params;
  if (!id) {
    throw new Error('missing id');
  }

  const firestore = adminApp.firestore();

  const docRef = firestore.doc(`announces/${id}`).withConverter(converters.announce);
  const curData = (await docRef.get()).data();
  if (!curData) {
    console.log('no data', id);
    return;
  }
  if (!curData.users[uid]?.own) {
    console.log('not owner', id, uid);
    return;
  }

  const updateData: Partial<Announce_FS> = {
    del: true,
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };
  await docRef.update(updateData);
};
