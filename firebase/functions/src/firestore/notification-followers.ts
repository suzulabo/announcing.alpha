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
  hour: number,
  token: string,
  lang: Lang,
  follows: { [announceID: string]: [prevHour?: number] },
) => {
  const data = {
    hour,
    followers: { [token]: [lang, follows] },
    unfollows: FieldValue.arrayRemove(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-hourly/${hour}`), data, {
    merge: true,
  });
};

const unsetHourlyNotification = (
  firestore: Firestore,
  batch: Batch,
  hour: number,
  token: string,
) => {
  const data = {
    followers: { [token]: FieldValue.delete() },
    unfollows: FieldValue.arrayUnion(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-hourly/${hour}`), data, {
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

  const houlryMap = new Map<number, { [announceID: string]: [prevHour?: number] }>();

  for (const follow of follower.follows) {
    const announceID = follow.id;
    const hours = follow.hours || [];

    if (hours.length == 0) {
      const prefix = `${announceID}-imm`;
      const update = () => {
        setImmediateNotification(firestore, batch, announceID, token, follower.lang);
      };
      const remove = () => {
        unsetImmediateNotification(firestore, batch, announceID, token);
      };
      result.push({ prefix, update, remove });
    } else {
      hours.forEach((hour, i) => {
        const hourly = houlryMap.get(hour) || {};
        if (hours.length >= 2) {
          const prevHour = i == 0 ? hours[hours.length - 1] : hours[i - 1];
          hourly[announceID] = [prevHour];
        } else {
          hourly[announceID] = [];
        }
        houlryMap.set(hour, hourly);
      });
    }
  }

  for (const [hour, follows] of houlryMap.entries()) {
    result.push({
      prefix: `hourly-${hour}`,
      update: () => {
        setHourlyNotification(firestore, batch, hour, token, follower.lang, follows);
      },
      remove: () => {
        unsetHourlyNotification(firestore, batch, hour, token);
      },
    });
  }

  if (houlryMap.size > 0) {
  }

  return result;
};

const updateSchedule = async (
  token: string,
  before: NotificationFollower | null,
  current: NotificationFollower | null,
  adminApp: admin.app.App,
) => {
  const firestore = adminApp.firestore();
  const batch = firestore.batch();

  const updators = current ? genUpdators(firestore, batch, token, current) : [];
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
): Promise<void> => {
  return updateSchedule(qds.id, qds.data() as NotificationFollower, null, adminApp);
};
