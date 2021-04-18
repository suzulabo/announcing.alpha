import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Message } from 'firebase-functions/lib/providers/pubsub';
import { Post } from '../shared';
import { converters } from '../utils/firestore';
import { getToken } from './token';

const pubQueue = async (msgs: admin.messaging.MulticastMessage[]) => {
  const pubsub = new PubSub();
  const topic = pubsub.topic('send-notification', {
    batching: { maxMessages: 100, maxMilliseconds: 50 },
  });
  for (const msg of msgs) {
    console.debug('pub', msg);
    void topic.publishJSON({ msg });
  }
  await topic.flush();
};

export const pubsubSendNotification = async (
  msg: Message,
  ctx: EventContext,
  adminApp: admin.app.App,
): Promise<number> => {
  const messaging = adminApp.messaging();
  const nmsg = msg.json.msg as admin.messaging.MulticastMessage;
  console.debug('send', nmsg);
  const result = await messaging.sendMulticast(nmsg);
  if (result.failureCount > 0) {
    // TOOD
  }
  return 0;
};

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
  const data = { announceID, ...(announceMeta.icon && { icon: announceMeta.icon }) };

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
      msgs.push({ data, notification, tokens: [...tokens] });
      tokens = [];
    }
  }
  if (tokens.length > 0) {
    msgs.push({ data, notification, tokens: [...tokens] });
  }

  if (msgs.length == 0) {
    console.debug('no msgs');
    return;
  }
  await pubQueue(msgs);
};
