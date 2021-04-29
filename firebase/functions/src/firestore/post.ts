import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { pubMulticastMessages } from '../pubsub/send-notification';
import { Announce, AnnounceMeta, Lang, Post } from '../shared';
import { ImmediateNotification, ImmediateNotificationArchive } from '../utils/datatypes';
import { logger } from '../utils/logger';

const getImmediateNotificationFollowers = async (
  firestore: admin.firestore.Firestore,
  announceID: string,
) => {
  const immediateRef = firestore.doc(`notification-immediate/${announceID}`);
  const immediate = (await immediateRef.get()).data() as ImmediateNotification;
  if (!immediate) {
    return;
  }

  const followers = [] as [string, [lang: Lang]][];
  if (immediate.archives) {
    const archivesRef = immediateRef.collection('archives');
    for (const archiveID of immediate.archives) {
      const archive = (
        await archivesRef.doc(archiveID).get()
      ).data() as ImmediateNotificationArchive;
      if (archive) {
        followers.push(...Object.entries(archive.followers));
      }
    }
  }

  if (immediate.followers) {
    followers.push(...Object.entries(immediate.followers));
  }

  if (!immediate.unfollows) {
    return new Map(followers);
  } else {
    const filtered = followers.filter(([token]) => {
      return !immediate.unfollows!.includes(token);
    });
    return new Map(filtered);
  }
};

export const firestoreCreatePost = async (
  qds: QueryDocumentSnapshot,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  // check edited post
  if (qds.id.includes('-')) {
    logger.debug('edited post');
    return;
  }

  const announceID = context.params.announceID;

  const firestore = adminApp.firestore();
  const followers = await getImmediateNotificationFollowers(firestore, announceID);
  if (!followers || followers.size == 0) {
    return;
  }

  const tokensSet = new Set<string>(followers.keys());

  const announceMeta = await (async () => {
    const announceRef = firestore.doc(`announces/${announceID}`);
    const a = (await announceRef.get()).data() as Announce;
    if (!a) {
      logger.warn('missing announce', announceID);
      return;
    }
    const m = (await announceRef.collection('meta').doc(a.mid).get()).data() as AnnounceMeta;
    return m;
  })();

  if (!announceMeta) {
    logger.warn('missing announce meta', announceID);
    return;
  }

  const postData = qds.data() as Post;
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