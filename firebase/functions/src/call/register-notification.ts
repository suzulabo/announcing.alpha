import { getTimezoneOffset } from 'date-fns-tz';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { isLang, RegisterNotificationParams } from '../shared';
import { NotificationDevice } from '../utils/datatypes';
import { logger } from '../utils/logger';
import { checkSign } from '../utils/sign';

const sortNum = (a: number[]) => {
  a.sort((a, b) => {
    return a - b;
  });
  return a;
};

export const callRegisterNotification = async (
  params: Partial<RegisterNotificationParams>,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  logger.debug('params:', params);
  const { fcmToken, signKey, sign, lang, tz, follows: _follows } = params;

  if (!fcmToken) {
    throw new Error('missing fcmToken');
  }
  if (fcmToken.length > 300) {
    throw new Error(`fcmToken is too long (${fcmToken.length})`);
  }
  if (!lang) {
    throw new Error('missing lang');
  }
  if (!tz) {
    throw new Error('missing tz');
  }

  getTimezoneOffset(tz); // check timezone

  if (!isLang(lang)) {
    throw new Error(`invalid lang (${lang})`);
  }
  if (!_follows) {
    throw new Error('missing follows');
  }

  const follows = {} as NotificationDevice['follows'];
  for (const [id, v] of Object.entries(_follows)) {
    if (id.length != 12) {
      throw new Error(`invalid follow (${JSON.stringify(_follows)})`);
    }
    if (v.hours) {
      for (const hour of v.hours) {
        if (!(hour >= 0 && hour < 24)) {
          throw new Error(`invalid hour (${JSON.stringify(_follows)})`);
        }
      }
      sortNum(v.hours);
      follows[id] = { hours: v.hours };
    } else {
      follows[id] = {};
    }
  }

  if (!signKey) {
    throw new Error('missing signKey');
  }
  if (!sign) {
    throw new Error('missing sign');
  }

  {
    const body = checkSign(signKey, sign);
    if (!body) {
      throw new Error('invalid sign');
    }
    const [date, token, ...ids] = body;
    if (token != fcmToken) {
      throw new Error('invalid sign (token)');
    }
    const d = new Date(date).getTime();
    const now = Date.now();
    if (!(d >= now - 1000 * 60 * 60 && d <= now + 1000 * 60 * 60)) {
      throw new Error('invalid sign (date)');
    }
    const fIds = Object.keys(follows).sort();
    if (fIds.join('\0') != ids.join('\0')) {
      throw new Error('invalid sign (ids)');
    }
  }

  const firestore = adminApp.firestore();
  const docRef = firestore.doc(`notification-followers/${fcmToken}`);
  {
    const doc = (await docRef.get()).data() as NotificationDevice;
    if (doc) {
      if (doc.signKey != signKey) {
        throw new Error('invalid signkey');
      }
    }
  }

  if (Object.keys(follows).length > 0) {
    const data = {
      signKey,
      lang,
      tz,
      follows,
      uT: admin.firestore.FieldValue.serverTimestamp(),
    };
    await firestore.doc(`notif-devices/${fcmToken}`).set(data);

    logger.info('SET NOTIFICATION:', { fcmToken, lang, follows });
  } else {
    await firestore.doc(`notif-devices/${fcmToken}`).delete();
    logger.info('UNSET NOTIFICATION:', { fcmToken });
  }
};
