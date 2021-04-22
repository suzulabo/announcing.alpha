import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { isLang, RegisterNotificationParams } from '../shared';
import { Notification } from '../utils/firestore';

const sortNum = (a: number[]) => {
  a.sort((a, b) => {
    return a - b;
  });
  return a;
};

export const callRegisterNotification = async (
  params: RegisterNotificationParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  console.debug('params:', params);
  const { fcmToken, lang, notifs } = params;

  if (!fcmToken) {
    throw new Error('missing fcmToken');
  }
  if (fcmToken.length > 300) {
    throw new Error(`fcmToken is too long (${fcmToken.length})`);
  }
  if (!lang) {
    throw new Error('missing lang');
  }
  if (!isLang(lang)) {
    throw new Error(`invalid lang (${lang})`);
  }
  if (!notifs) {
    throw new Error('missing notifs');
  }

  const anytimeSet = new Set<string>();
  const hoursIndexSet = new Set<number>();
  const scheduled = [] as { id: string; hours: number[] }[];
  for (const notif of notifs) {
    if (!notif.id || notif.id.length != 12 || !notif.hours) {
      throw new Error(`invalid follow (${JSON.stringify(notif)})`);
    }
    if (notif.hours.length == 0) {
      anytimeSet.add(notif.id);
    } else {
      for (const hour of notif.hours) {
        if (!(hour >= 0 && hour <= 23)) {
          throw new Error(`invalid hour (${JSON.stringify(notif)})`);
        }
        hoursIndexSet.add(hour);
      }
      scheduled.push({ id: notif.id, hours: sortNum(notif.hours) });
    }
  }

  const firestore = adminApp.firestore();

  const notification: Notification = {
    lang,
    ...(anytimeSet.size > 0 && { anytime: [...anytimeSet] }),
    ...(hoursIndexSet.size > 0 && { hours: sortNum([...hoursIndexSet]) }),
    ...(hoursIndexSet.size > 0 && { scheduled }),
    uT: admin.firestore.FieldValue.serverTimestamp() as any,
  };

  await firestore.doc(`notifications/${fcmToken}`).set(notification);

  console.info('SET NOTIFICATION:', fcmToken, notification);
};
