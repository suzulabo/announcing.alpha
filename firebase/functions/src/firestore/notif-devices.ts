import admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Lang } from '../shared';
import { NotificationDevice } from '../utils/datatypes';

import Firestore = admin.firestore.Firestore;
import Batch = admin.firestore.WriteBatch;
import FieldValue = admin.firestore.FieldValue;

const setImmediateNotification = (
  firestore: Firestore,
  batch: Batch,
  announceID: string,
  token: string,
  lang: Lang,
) => {
  const data = {
    announceID,
    devices: {
      [token]: [lang],
    },
    cancels: FieldValue.arrayRemove(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notif-imm/${announceID}`), data, {
    merge: true,
  });
};

const unsetImmediateNotification = (
  firestore: Firestore,
  batch: Batch,
  announceID: string,
  token: string,
) => {
  const data = {
    devices: { [token]: FieldValue.delete() },
    cancels: FieldValue.arrayUnion(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notif-imm/${announceID}`), data, {
    merge: true,
  });
};

const genUpdators = (
  firestore: Firestore,
  batch: Batch,
  token: string,
  device: NotificationDevice,
) => {
  const result = [] as {
    key: string;
    update: () => void;
    remove: () => void;
  }[];

  for (const announceID of device.announces) {
    const key = `imm-${announceID}`;
    const update = () => {
      setImmediateNotification(firestore, batch, announceID, token, device.lang);
    };
    const remove = () => {
      unsetImmediateNotification(firestore, batch, announceID, token);
    };
    result.push({ key, update, remove });
  }

  return result;
};

const updateSchedule = async (
  token: string,
  before: NotificationDevice | null,
  current: NotificationDevice | null,
  adminApp: admin.app.App,
) => {
  const firestore = adminApp.firestore();
  const batch = firestore.batch();

  const updators = current ? genUpdators(firestore, batch, token, current) : [];
  if (before) {
    const keysSet = new Set(
      updators.map(v => {
        return v.key;
      }),
    );
    const beforeUpdators = genUpdators(firestore, batch, token, before);
    for (const updator of beforeUpdators) {
      if (!keysSet.has(updator.key)) {
        updator.remove();
      }
    }
  }

  for (const updator of updators) {
    updator.update();
  }

  await batch.commit();
};

export const firestoreNotificationDeviceWrite = (
  change: Change<DocumentSnapshot>,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  return updateSchedule(
    context.params.token,
    change.before.data() as NotificationDevice,
    change.after.data() as NotificationDevice,
    adminApp,
  );
};
