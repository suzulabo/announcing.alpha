import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { RegisterNotificationParams } from '../shared';
import { converters } from '../utils/firestore';
import { getTokenHash } from './token';

export const callRegisterNotification = async (
  params: RegisterNotificationParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  console.debug('params:', params);
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

  const notificationsRef = firestore
    .collection('notifications')
    .withConverter(converters.notification);
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
      curDocRef = doc.ref;
      const n = doc.data();
      curHours.push(...n.members[hash]);
    }
  }

  // check same
  if (enable && curDocRef && hours.join(':') == curHours.join(':')) {
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
    if (!enable || curDocRef?.id != announceID) {
      batch.update(curDocRef, { [`members.${hash}`]: admin.firestore.FieldValue.delete() });
    }
  }

  await batch.commit();

  console.info(`SET NOTIFICATION: ${announceID} ${hash} ${hours.join(':')}`);
};
