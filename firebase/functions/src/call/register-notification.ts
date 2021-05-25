import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { isLang, RegisterNotificationParams } from '../shared';
import { NotificationDevice } from '../utils/datatypes';
import { logger } from '../utils/logger';
import { checkSign } from '../utils/sign';

export const callRegisterNotification = async (
  params: Partial<RegisterNotificationParams>,
  _context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const { token, signKey, sign, lang, announces } = params;

  if (!token) {
    throw new Error('missing token');
  }
  if (token.length > 300) {
    throw new Error(`fcmToken is too long (${token.length})`);
  }
  if (!lang) {
    throw new Error('missing lang');
  }
  if (!isLang(lang)) {
    throw new Error(`invalid lang (${lang})`);
  }
  if (!signKey) {
    throw new Error('missing signKey');
  }
  if (!sign) {
    throw new Error('missing sign');
  }
  if (!announces) {
    throw new Error('missing announces');
  }
  announces.forEach(v => {
    if (v.length != 12) throw new Error(`invalid announceID ${v}`);
  });

  {
    const body = checkSign(signKey, sign);
    if (!body) {
      throw new Error('invalid sign');
    }
    const [date, _token, ...ids] = body;
    if (_token != token) {
      throw new Error('invalid sign (token)');
    }
    const d = new Date(date).getTime();
    const now = Date.now();
    if (!(d >= now - 1000 * 60 * 60 && d <= now + 1000 * 60 * 60)) {
      throw new Error('invalid sign (date)');
    }
    if (announces.join('\0') != ids.join('\0')) {
      throw new Error('invalid sign (ids)');
    }
  }

  const firestore = adminApp.firestore();
  const docRef = firestore.doc(`notif-devices/${token}`);
  {
    const doc = (await docRef.get()).data() as NotificationDevice;
    if (doc) {
      if (doc.signKey != signKey) {
        throw new Error('invalid signkey');
      }
    }
  }

  if (announces.length > 0) {
    const data = {
      signKey,
      lang,
      announces,
      uT: admin.firestore.FieldValue.serverTimestamp(),
    };
    await firestore.doc(`notif-devices/${token}`).set(data);
    logger.info('SET NOTIFICATION:', { token, data });
  } else {
    await firestore.doc(`notif-devices/${token}`).delete();
    logger.info('UNSET NOTIFICATION:', { token });
  }
};
