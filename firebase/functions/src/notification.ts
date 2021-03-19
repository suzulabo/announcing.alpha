import { RegisterNotificationParams } from 'announsing-shared';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { toMD5Base62 } from './utils';

interface FcmToken {
  [hash: string]: string;
}

const tokenMap = new Map<string, string>();

const getTokenHash = async (token: string, firestore: admin.firestore.Firestore) => {
  const hash = toMD5Base62(token).substring(0, 10);
  const cachedToken = tokenMap.get(hash);
  if (cachedToken) {
    if (cachedToken == token) {
      return hash;
    } else {
      throw new Error(`Collision? [${hash}](${token} : ${cachedToken})`);
    }
  }

  const qs = await firestore.collection('fcmtokens').where(hash, '>', '').limit(1).get();
  if (qs.size > 0) {
    const data = qs.docs[0].data() as FcmToken;
    const storedToken = data[hash];
    if (token != storedToken) {
      throw new Error(`Collision? [${hash}](${token} : ${storedToken})`);
    }
    return hash;
  }

  await firestore.doc(`fcmtokens/0`).set({ [hash]: token }, { merge: true });

  tokenMap.set(hash, token);

  return hash;
};

export const callRegisterNotification = async (
  params: RegisterNotificationParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const { fcmToken, announceID, mode, hours } = params;

  if (!fcmToken) {
    throw new Error('missing fcmToken');
  }
  if (fcmToken.length > 300) {
    throw new Error(`fcmToken is too long (${fcmToken.length})`);
  }
  if (!announceID) {
    throw new Error('missing announceID');
  }
  if (!['disabled', 'always', 'hours'].includes(mode as string)) {
    throw new Error(`invalid mode: [${mode}]`);
  }
  if (mode == 'hours') {
    if (!hours) {
      throw new Error('missing hours');
    }
    hours.forEach(v => {
      if (v < 0 || v > 23) {
        throw new Error(`invalid hour: [${hours.join(',')}]`);
      }
    });
  }

  const firestore = adminApp.firestore();
  const hash = await getTokenHash(fcmToken, firestore);

  const notificationsRef = firestore.collection('notifications');
  const curHours: number[] = [];
  {
    const qs = await notificationsRef
      .where('announceID', '==', announceID)
      .where('members', 'array-contains', hash)
      .limit(30) // just in case
      .get();
    qs.forEach(v => {
      curHours.push(v.data().hour);
    });
  }

  const batch = firestore.batch();
  console.log(mode, curHours);
  if (mode == 'always') {
    if (!curHours.includes(99)) {
      batch.set(
        notificationsRef.doc(`${announceID}_99`),
        {
          announceID,
          hour: 99,
          members: admin.firestore.FieldValue.arrayUnion(hash),
        },
        { merge: true },
      );
    }
  } else if (mode == 'hours') {
    hours!.forEach(v => {
      if (curHours.includes(v)) {
        return;
      }
      batch.set(
        notificationsRef.doc(`${announceID}_${v}`),
        {
          announceID,
          hour: v,
          members: admin.firestore.FieldValue.arrayUnion(hash),
        },
        { merge: true },
      );
    });
  }

  curHours.forEach(v => {
    if (v == 99 && mode == 'always') {
      return;
    }
    if (mode == 'hours' && hours!.includes(v)) {
      return;
    }
    batch.update(notificationsRef.doc(`${announceID}_${v}`), {
      members: admin.firestore.FieldValue.arrayRemove(hash),
    });
  });

  await batch.commit();
};
