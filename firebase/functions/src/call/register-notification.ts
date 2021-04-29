import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { isLang, RegisterNotificationParams } from '../shared';
import { logger } from '../utils/logger';

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
  logger.debug('params:', params);
  const { fcmToken, lang, follows: _follows } = params;

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
  if (!_follows) {
    throw new Error('missing follows');
  }

  const follows = [] as { id: string; hours?: number[] }[];
  for (const follow of _follows) {
    if (!follow.id || follow.id.length != 12) {
      throw new Error(`invalid follow (${JSON.stringify(follow)})`);
    }
    if (follow.hours) {
      for (const hour of follow.hours) {
        if (!(hour >= 0 && hour <= 23)) {
          throw new Error(`invalid hour (${JSON.stringify(follow)})`);
        }
      }
      sortNum(follow.hours);
      follows.push({ id: follow.id, hours: sortNum(follow.hours) });
    } else {
      follows.push({ id: follow.id });
    }
  }

  const firestore = adminApp.firestore();
  if (follows.length > 0) {
    const data = {
      lang,
      follows,
      uT: admin.firestore.FieldValue.serverTimestamp(),
    };
    await firestore.doc(`notification-followers/${fcmToken}`).set(data);

    logger.info('SET NOTIFICATION:', { fcmToken, lang, follows });
  } else {
    await firestore.doc(`notification-followers/${fcmToken}`).delete();
    logger.info('UNSET NOTIFICATION:', { fcmToken });
  }
};
