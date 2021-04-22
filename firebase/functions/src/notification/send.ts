import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Post } from '../shared';
import { converters } from '../utils/firestore';
import { logger } from '../utils/logger';
import { pubMulticastMessages } from './pubsub';

export const firestoreCreatePost = async (
  qs: QueryDocumentSnapshot,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  // check edited post
  if (qs.id.includes('-')) {
    logger.debug('edited post');
    return;
  }

  const announceID = context.params.announceID;

  const firestore = adminApp.firestore();
  const notificationsRef = firestore
    .collection('notifications')
    .withConverter(converters.notification);

  const tokensSet = new Set<string>();
  {
    const updated = 0; // TODO
    const qs = await notificationsRef
      .where('anytime', 'array-contains', announceID)
      .where('uT', '>', admin.firestore.Timestamp.fromMillis(updated))
      .limit(10)
      .get();
    qs.forEach(d => {
      tokensSet.add(d.id);
    });
    if (tokensSet.size == 0) {
      logger.debug('no followers', announceID);
      return;
    }
  }

  const announceMeta = await (async () => {
    const announceRef = firestore.doc(`announces/${announceID}`).withConverter(converters.announce);
    const a = (await announceRef.get()).data();
    if (!a) {
      logger.warn('missing announce', announceID);
      return;
    }
    const m = (
      await announceRef.collection('meta').withConverter(converters.announceMeta).doc(a.mid).get()
    ).data();

    return m;
  })();

  if (!announceMeta) {
    logger.warn('missing announce meta', announceID);
    return;
  }

  const postData = qs.data() as Post;
  const msgs = [] as admin.messaging.MulticastMessage[];
  const notification = { title: announceMeta.name, body: postData.title || postData.body };
  const data = { announceID, ...(announceMeta.icon && { icon: announceMeta.icon }) };

  let tokens = [...tokensSet] as string[];
  while (tokens.length > 0) {
    msgs.push({ data, notification, tokens: tokens.splice(0, 500) });
  }

  if (msgs.length == 0) {
    logger.debug('no msgs');
    return;
  }

  await pubMulticastMessages(msgs);
};
