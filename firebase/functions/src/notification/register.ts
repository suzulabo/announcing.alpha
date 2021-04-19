import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { isLang, RegisterNotificationParams } from '../shared';
import { Device } from '../utils/firestore';

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

  const hoursSet = new Set<number>();
  for (const notif of notifs) {
    if (!notif.id || notif.id.length != 12 || !notif.hours) {
      throw new Error(`invalid follow (${notif})`);
    }
    for (const hour of notif.hours) {
      if (!(hour >= 0 && hour <= 23)) {
        throw new Error(`invalid hour (${notif})`);
      }
      hoursSet.add(hour);
    }
  }

  const firestore = adminApp.firestore();

  const device: Device = {
    lang,
    hours: sortNum([...hoursSet]),
    notifs: notifs.map(v => {
      return {
        id: v.id!,
        hours: sortNum(v.hours!),
      };
    }),
    uT: admin.firestore.FieldValue.serverTimestamp() as any,
  };

  await firestore.doc(`devices/${fcmToken}`).set(device);

  console.info(`SET DEVICE: ${fcmToken} ${device}`);
};
