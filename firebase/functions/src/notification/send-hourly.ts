import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { announceCache, announceMetaCache } from '../utils/cache';
import { converters, Notification } from '../utils/firestore';
import { logger } from '../utils/logger';
import { postIDtoMillis } from '../utils/util';
import { pubTokenMessages } from './pubsub';

const H1 = 1000 * 60 * 60;
const H24 = H1 * 24;

const titles = {
  ja: '新しいお知らせがあります',
  en: 'New posts',
};

const genMessage = async (
  hour: number,
  now: number,
  token: string,
  notif: Notification,
  firestore: admin.firestore.Firestore,
) => {
  if (!notif.scheduled) {
    logger.debug('no notif.scheduled');
    return;
  }

  const names = [] as string[];

  for (const scheduled of notif.scheduled) {
    const hours = scheduled.hours;
    const idx = hours.indexOf(hour);
    if (idx < 0) {
      logger.debug('no hours');
      continue;
    }
    const annouceData = await announceCache(scheduled.id, firestore);
    if (!annouceData) {
      logger.debug('missing announce', scheduled.id);
      // TODO : should delete
      continue;
    }
    const posts = annouceData.posts;
    if (!posts || posts.length == 0) {
      logger.debug('no posts', scheduled.id);
      continue;
    }

    const latestPostTime = postIDtoMillis(posts[posts.length - 1]);
    if (latestPostTime <= now - H24) {
      continue;
    }

    if (hours.length >= 2) {
      const betweenHour = idx > 0 ? hour - hours[idx - 1] : hour + (24 - hours[hours.length - 1]);
      if (latestPostTime <= now - H1 * betweenHour) {
        continue;
      }
    }

    const metaData = await announceMetaCache(scheduled.id, annouceData.mid, firestore);
    if (!metaData) {
      logger.warn('missing meta', { id: scheduled.id, mid: annouceData.mid });
      continue;
    }
    names.push(metaData.name);
  }

  if (names.length == 0) {
    return;
  }

  const title = titles[notif.lang];
  const msg: admin.messaging.TokenMessage = {
    token,
    notification: {
      title,
      body: names.join(', '),
    },
  };
  return msg;
};

export const pubsubHourly = async (
  hour: number,
  context: EventContext,
  adminApp: admin.app.App,
) => {
  const firestore = adminApp.firestore();
  const notificationsRef = firestore
    .collection('notifications')
    .withConverter(converters.notification);

  const msgs = [] as admin.messaging.TokenMessage[];

  const updated = 0; // TODO
  const qs = await notificationsRef
    .where('hours', 'array-contains', hour)
    .where('uT', '>', admin.firestore.Timestamp.fromMillis(updated))
    .limit(10)
    .get();

  const now = Date.now();
  for (const doc of qs.docs) {
    const data = doc.data();
    const msg = await genMessage(hour, now, doc.id, data, firestore);
    if (msg) {
      msgs.push(msg);
    }
  }

  if (msgs.length > 0) {
    await pubTokenMessages(msgs);
  }
};
