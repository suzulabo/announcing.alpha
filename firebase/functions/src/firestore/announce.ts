import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Announce } from '../shared';

export const firestoreDeleteAnnounce = async (
  qds: QueryDocumentSnapshot,
  _context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const id = qds.id;
  const announceData = qds.data() as Announce;

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