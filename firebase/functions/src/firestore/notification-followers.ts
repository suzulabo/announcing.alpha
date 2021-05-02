import { format, toDate, zonedTimeToUtc } from 'date-fns-tz';
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

const padNum = (n: number, l: number) => {
  return n.toString().padStart(l, '0');
};

const setHourlyNotification = (
  firestore: Firestore,
  batch: Batch,
  time: number,
  token: string,
  lang: Lang,
  follows: { [announceID: string]: [hoursBefore?: number] },
) => {
  const data = {
    time,
    followers: { [token]: [lang, follows] },
    unfollows: FieldValue.arrayRemove(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-hourly/${padNum(time, 4)}`), data, {
    merge: true,
  });
};

const unsetHourlyNotification = (
  firestore: Firestore,
  batch: Batch,
  time: number,
  token: string,
) => {
  const data = {
    followers: { [token]: FieldValue.delete() },
    unfollows: FieldValue.arrayUnion(token),
    uT: FieldValue.serverTimestamp(),
  };
  batch.set(firestore.doc(`notification-hourly/${padNum(time, 4)}`), data, {
    merge: true,
  });
};

const genUpdators = (
  firestore: Firestore,
  batch: Batch,
  token: string,
  follower: NotificationFollower,
  now: number,
) => {
  const result = [] as {
    prefix: string;
    update: () => void;
    remove: () => void;
  }[];

  const houlryMap = new Map<number, { [announceID: string]: [hoursBefore?: number] }>();

  for (const [announceID, v] of Object.entries(follower.follows)) {
    const hours = v.hours || [];

    if (hours.length == 0) {
      const prefix = `imm-${announceID}`;
      const update = () => {
        setImmediateNotification(firestore, batch, announceID, token, follower.lang);
      };
      const remove = () => {
        unsetImmediateNotification(firestore, batch, announceID, token);
      };
      result.push({ prefix, update, remove });
    } else {
      hours.forEach((hour, i) => {
        const zonedNow = toDate(now, { timeZone: follower.tz });
        if (hour >= zonedNow.getHours()) {
          zonedNow.setDate(zonedNow.getDate() + 1);
        }
        const utcTime = zonedTimeToUtc(
          `${format(zonedNow, 'yyyy-MM-dd')} ${padNum(hour, 2)}:00:00`,
          follower.tz,
        );
        const time = utcTime.getUTCHours() * 100 + Math.floor(utcTime.getUTCMinutes() / 15) * 15;

        const hourly = houlryMap.get(hour) || {};
        if (hours.length >= 2) {
          const prevHour = i == 0 ? hours[hours.length - 1] : hours[i - 1];
          const hoursBefore = hour > prevHour ? hour - prevHour : 24 - prevHour + hour;
          hourly[announceID] = [hoursBefore];
        } else {
          hourly[announceID] = [];
        }
        houlryMap.set(time, hourly);
      });
    }
  }

  for (const [time, follows] of houlryMap.entries()) {
    result.push({
      prefix: `hourly-${time}`,
      update: () => {
        setHourlyNotification(firestore, batch, time, token, follower.lang, follows);
      },
      remove: () => {
        unsetHourlyNotification(firestore, batch, time, token);
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
  const now = Date.now();

  const updators = current ? genUpdators(firestore, batch, token, current, now) : [];
  if (before) {
    const prefixSet = new Set(
      updators.map(v => {
        return v.prefix;
      }),
    );
    const beforeUpdators = genUpdators(firestore, batch, token, before, now);
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
