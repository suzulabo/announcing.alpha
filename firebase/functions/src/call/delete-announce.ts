import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { DeleteAnnounceParams } from '../shared';
import { logger } from '../utils/logger';

export const callDeleteAnnounce = async (
  params: Partial<DeleteAnnounceParams>,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new Error('missing uid');
  }

  const { id } = params;
  if (!id) {
    throw new Error('missing id');
  }

  const firestore = adminApp.firestore();

  const owners = await firestore.collection('users').where('announces', 'array-contains', id).get();

  const batch = firestore.batch();
  let isOwner = false;
  for (const d of owners.docs) {
    if (d.id == uid) {
      isOwner = true;
    }
    batch.update(d.ref, {
      announces: admin.firestore.FieldValue.arrayRemove(id),
      uT: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  if (!isOwner) {
    logger.warn('not owner', { uid, id });
    return;
  }
  batch.delete(firestore.doc(`announces/${id}`));

  await batch.commit();
};
