import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { RegisterNotificationParams } from './shared';
import { toMD5Base62 } from './utils';

interface FcmToken {
  [hash: string]: string;
}
interface Notification {
  announceID: string;
  members: {
    [hash: string]: number[];
  };
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
  const { fcmToken, announceID, enable, hours: _hours } = params;

  if (!fcmToken) {
    throw new Error('missing fcmToken');
  }
  if (fcmToken.length > 300) {
    throw new Error(`fcmToken is too long (${fcmToken.length})`);
  }
  if (!announceID) {
    throw new Error('missing announceID');
  }
  if (_hours) {
    _hours.forEach(v => {
      if (v < 0 || v > 23) {
        throw new Error(`invalid hour: [${hours.join(',')}]`);
      }
    });
  }

  const hours = _hours || [];

  const firestore = adminApp.firestore();
  const hash = await getTokenHash(fcmToken, firestore);

  const notificationsRef = firestore.collection('notifications');
  const curHours: number[] = [];
  let curDocRef!: admin.firestore.DocumentReference;
  {
    const qs = await notificationsRef
      .where('announceID', '==', announceID)
      .orderBy(`members.${hash}`)
      .limit(1)
      .get();
    if (!qs.empty) {
      const doc = qs.docs[0];
      if (doc.id != announceID) {
        curDocRef = doc.ref;
      }
      const n = doc.data() as Notification;
      curHours.push(...n.members[hash]);
    }
  }

  // check same
  if (enable && hours.join(':') == curHours.join(':')) {
    console.debug('same hours', announceID, hash);
    return;
  }

  const batch = firestore.batch();
  if (enable) {
    batch.set(
      notificationsRef.doc(`${announceID}`),
      {
        announceID,
        members: { [hash]: hours },
      },
      { merge: true },
    );
  }

  if (curDocRef) {
    batch.update(curDocRef, { [`members.${hash}`]: admin.firestore.FieldValue.delete() });
  }

  await batch.commit();

  console.info(`SET NOTIFICATION: ${announceID} ${hash} ${hours.join(':')}`);
};
