import admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Lang } from '../shared';
import { NotificationFollower } from '../utils/datatypes';

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
    followers: {
      [token]: [lang],
    },
    unfollows: FieldValue.arrayRemove(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-immediate/${announceID}`), data, {
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
    followers: { [token]: FieldValue.delete() },
    unfollows: FieldValue.arrayUnion(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-immediate/${announceID}`), data, {
    merge: true,
  });
};

const setHourlyNotification = (
  firestore: Firestore,
  batch: Batch,
  announceID: string,
  hour: number,
  token: string,
  lang: Lang,
  prevHour?: number,
) => {
  const data = {
    announceID,
    followers: { [token]: prevHour == null ? [lang] : [lang, prevHour] },
    unfollows: FieldValue.arrayRemove(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-hourly/${announceID}-${hour}`), data, {
    merge: true,
  });
};

const unsetHourlyNotification = (
  firestore: Firestore,
  batch: Batch,
  announceID: string,
  hour: number,
  token: string,
) => {
  const data = {
    followers: { [token]: FieldValue.delete() },
    unfollows: FieldValue.arrayUnion(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-hourly/${announceID}-${hour}`), data, {
    merge: true,
  });
};

const genUpdators = (
  firestore: Firestore,
  batch: Batch,
  token: string,
  follower: NotificationFollower,
) => {
  const result = [] as {
    prefix: string;
    update: () => void;
    remove: () => void;
  }[];
  for (const follow of follower.follows) {
    const announceID = follow.id;
    const hours = follow.hours || [];

    if (hours.length == 0) {
      const prefix = `${announceID}-imm`;
      const update = () => {
        return setImmediateNotification(firestore, batch, announceID, token, follower.lang);
      };
      const remove = () => {
        return unsetImmediateNotification(firestore, batch, announceID, token);
      };
      result.push({ prefix, update, remove });
    } else {
      hours.forEach((hour, i) => {
        const prefix = `${announceID}-${hour}`;
        const update = () => {
          let prevHour = undefined;
          if (hours.length >= 2) {
            prevHour = i == 0 ? hours[hours.length - 1] : hours[i - 1];
          }
          return setHourlyNotification(
            firestore,
            batch,
            announceID,
            hour,
            token,
            follower.lang,
            prevHour,
          );
        };
        const remove = () => {
          return unsetHourlyNotification(firestore, batch, announceID, hour, token);
        };
        result.push({ prefix, update, remove });
      });
    }
  }
  return result;
};

const updateSchedule = async (
  token: string,
  before: NotificationFollower | null,
  current: NotificationFollower,
  adminApp: admin.app.App,
) => {
  const firestore = adminApp.firestore();
  const batch = firestore.batch();

  const updators = genUpdators(firestore, batch, token, current);
  if (before) {
    const prefixSet = new Set(
      updators.map(v => {
        return v.prefix;
      }),
    );
    const beforeUpdators = genUpdators(firestore, batch, token, before);
    for (const updator of beforeUpdators) {
      if (!prefixSet.has(updator.prefix)) {
        updator.remove();
      }
    }
  }

  for (const updator of updators) {
    updator.update();
  }

  await batch.commit();
};

export const firestoreNotificationFollowerCreate = (
  qds: QueryDocumentSnapshot,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  return updateSchedule(qds.id, null, qds.data() as NotificationFollower, adminApp);
};

export const firestoreNotificationFollowerUpdate = (
  change: Change<QueryDocumentSnapshot>,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  return updateSchedule(
    change.after.id,
    change.before.data() as NotificationFollower,
    change.after.data() as NotificationFollower,
    adminApp,
  );
};

export const firestoreNotificationFollowerDelete = async (
  qds: QueryDocumentSnapshot,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {};
