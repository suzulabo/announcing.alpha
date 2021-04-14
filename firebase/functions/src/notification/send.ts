import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Post } from '../shared';
import { converters } from '../utils/firestore';
import { getToken } from './token';

export const firestoreCreatePost = async (
  qs: QueryDocumentSnapshot,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  // check edited post
  if (qs.id.includes('-')) {
    console.debug('edited post');
    return;
  }

  const announceID = context.params.announceID;

  const firestore = adminApp.firestore();
  const notificationsRef = firestore
    .collection('notifications')
    .withConverter(converters.notification);

  const members = new Set<string>();
  {
    const qs = await notificationsRef.where('announceID', '==', announceID).limit(10).get();
    qs.forEach(d => {
      const n = d.data();
      Object.entries(n.members || {}).forEach(([k, v]) => {
        if (v.length == 0) {
          members.add(k);
        }
      });
    });
    if (members.size == 0) {
      console.debug('no members', announceID);
      return;
    }
  }

  const announceMeta = await (async () => {
    const announceRef = firestore.doc(`announces/${announceID}`).withConverter(converters.announce);
    const a = (await announceRef.get()).data();
    if (!a) {
      console.warn('missing announce', announceID);
      return;
    }
    const m = (
      await announceRef.collection('meta').withConverter(converters.announceMeta).doc(a.mid).get()
    ).data();

    return m;
  })();

  if (!announceMeta) {
    console.warn('missing announce meta', announceID);
    return;
  }

  const postData = qs.data() as Post;
  const msgs = [] as admin.messaging.MulticastMessage[];
  const notification = { title: announceMeta.name, body: postData.title || postData.body };

  const membersArray = [...members];
  let tokens = [] as string[];
  while (membersArray.length > 0) {
    const hash = membersArray.shift()!;
    const token = await getToken(hash, firestore);
    if (!token) {
      console.warn('missing token', announceID, hash);
      continue;
    }
    tokens.push(token);
    if (tokens.length == 500) {
      msgs.push({ notification, tokens: [...tokens] });
      tokens = [];
    }
  }
  if (tokens.length > 0) {
    msgs.push({ notification, tokens: [...tokens] });
  }

  const messaging = admin.messaging();
  for (const msg of msgs) {
    console.log('send', msg);
    const result = await messaging.sendMulticast(msg);
    if (result.failureCount > 0) {
      // TOOD
    }
  }
};
