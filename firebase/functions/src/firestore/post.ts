import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { pubMulticastMessages } from '../pubsub/send-notification';
import { Announce, AnnounceMeta, Lang, Post } from '../shared';
import { ImmediateNotification, ImmediateNotificationArchive } from '../utils/datatypes';
import { logger } from '../utils/logger';

const getImmediateNotificationDevices = async (
  firestore: admin.firestore.Firestore,
  announceID: string,
) => {
  const immediateRef = firestore.doc(`notif-imm/${announceID}`);
  const immediate = (await immediateRef.get()).data() as ImmediateNotification;
  if (!immediate) {
    return;
  }

  const devices = [] as [string, [lang: Lang]][];
  if (immediate.archives) {
    const archivesRef = immediateRef.collection('archives');
    for (const archiveID of immediate.archives) {
      const archive = (
        await archivesRef.doc(archiveID).get()
      ).data() as ImmediateNotificationArchive;
      if (archive) {
        devices.push(...Object.entries(archive.devices));
      }
    }
  }

  if (immediate.devices) {
    devices.push(...Object.entries(immediate.devices));
  }

  const cancels = immediate.cancels;
  if (!cancels || cancels.length == 0) {
    return new Map(devices);
  } else {
    const filtered = devices.filter(([token]) => {
      return !cancels.includes(token);
    });
    return new Map(filtered);
  }
};

export const firestoreCreatePost = async (
  qds: QueryDocumentSnapshot,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const postData = qds.data() as Post;

  if (postData.edited) {
    return;
  }

  const announceID = context.params.announceID;
  const postID = qds.id;

  const firestore = adminApp.firestore();
  const devices = await getImmediateNotificationDevices(firestore, announceID);
  if (!devices || devices.size == 0) {
    return;
  }

  const tokensSet = new Set<string>(devices.keys());

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

  const msgs = [] as admin.messaging.MulticastMessage[];
  const notification: admin.messaging.Notification = {
    title: announceMeta.name,
    body: postData.title || postData.body,
  };
  const data = { announceID, postID, ...(announceMeta.icon && { icon: announceMeta.icon }) };

  const tokens = [...tokensSet] as string[];
  while (tokens.length > 0) {
    msgs.push({ data, notification, tokens: tokens.splice(0, 500) });
  }

  if (msgs.length == 0) {
    logger.debug('no msgs');
    return;
  }

  await pubMulticastMessages(msgs);
};
