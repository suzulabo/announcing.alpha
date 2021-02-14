import { Announce, DeleteAnnounceParams } from 'announsing-shared';
import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { User_FS } from './firestore';

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

  const owners = await firestore.collection('users').where('announces', 'array-contains', id).get();

  const batch = firestore.batch();
  let isOwner = false;
  for (const d of owners.docs) {
    if (d.id == uid) {
      isOwner = true;
    }
    batch.update(d.ref, { announces: admin.firestore.FieldValue.arrayRemove(id) } as User_FS);
  }
  if (!isOwner) {
    console.warn('not owner', uid, id);
    return;
  }
  batch.delete(firestore.doc(`announces/${id}`));

  await batch.commit();
};

export const firestoreDeleteAnnounce = async (
  qs: QueryDocumentSnapshot,
  _context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const id = qs.id;
  const announceData = qs.data() as Announce;

  const posts = announceData.posts ? announceData.posts.map(v => `announces/${id}/posts/${v}`) : [];
  const pathes = [...posts.reverse(), `announces/${id}/meta/${announceData.mid}`];

  const firestore = adminApp.firestore();

  while (pathes.length > 0) {
    const c = pathes.splice(0, 500);
    const batch = firestore.batch();
    for (const p of c) {
      batch.delete(firestore.doc(p));
    }
    await batch.commit();
  }
};
