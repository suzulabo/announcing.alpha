import admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Lang } from '../shared';
import {
  ImmediateNotification,
  ImmediateNotificationArchive,
  NotificationFollower,
} from '../utils/datatypes';
import { incString } from '../utils/incstring';
import { logger } from '../utils/logger';

import FieldValue = admin.firestore.FieldValue;

class FirestoreUpdator {
  private batch: admin.firestore.WriteBatch;
  constructor(private firestore: admin.firestore.Firestore) {
    this.batch = this.firestore.batch();
  }

  commit() {
    return this.batch.commit();
  }

  setImmediateNotification(announceID: string, token: string, lang: Lang) {
    const data = {
      announceID,
      [`followers.${token}`]: [lang],
      unfollows: FieldValue.arrayRemove(token),
      uT: FieldValue.serverTimestamp(),
    };
    this.batch.set(this.firestore.doc(`notification-immediate/${announceID}`), data, {
      merge: true,
    });
  }

  unsetImmediateNotification(announceID: string, token: string) {
    const data = {
      [`followers.${token}`]: FieldValue.delete(),
      unfollows: FieldValue.arrayUnion(token),
      uT: FieldValue.serverTimestamp(),
    };
    this.batch.set(this.firestore.doc(`notification-immediate/${announceID}`), data, {
      merge: true,
    });
  }

  shouldArchiveImmediateNotification(data: ImmediateNotification) {
    return (
      (data.followers ? Object.keys(data.followers).length : 0) +
        (data.unfollows ? data.unfollows.length : 0) >=
      5000
    );
  }

  async archiveImmediateNotification(announceID: string) {
    await this.firestore.runTransaction(async t => {
      const immediateRef = this.firestore.doc(`notification-immediate/${announceID}`);
      const immediate = (await t.get(immediateRef)).data() as ImmediateNotification;
      if (!immediate) {
        return;
      }
      const followers = immediate.followers || {};
      const unfollows = immediate.unfollows || [];
      const archives = immediate.archives || [];
      if (!this.shouldArchiveImmediateNotification(immediate)) {
        return;
      }

      const archiveFollowers = [] as [string, [lang: Lang]][];
      const reuses = [] as string[];
      const deletions = [] as string[];
      const archivesRef = immediateRef.collection('archives');
      for (const archiveID of archives) {
        const archive = (
          await archivesRef.doc(archiveID).get()
        ).data() as ImmediateNotificationArchive;
        if (!archive) {
          logger.warn(`missing archive ${announceID}-${archiveID}`);
          continue;
        }

        const entries = Object.entries(archive.followers);
        const filtered = entries.filter(([token]) => {
          return !(token in followers) && !unfollows.includes(token);
        });
        if (entries.length == filtered.length) {
          reuses.push(archiveID);
        } else {
          deletions.push(archiveID);
          archiveFollowers.push(...filtered);
        }
      }

      archiveFollowers.push(...Object.entries(followers));

      const newArchives = [...reuses];
      {
        let aID = incString.next(incString.max(archives));
        while (archiveFollowers.length > 0) {
          const data = {
            followers: archiveFollowers.splice(0, 5000),
          };
          if (deletions.length > 0) {
            const id = deletions.shift()!;
            t.set(archivesRef.doc(id), data);
            newArchives.push(id);
          } else {
            t.create(archivesRef.doc(aID), data);
            newArchives.push(aID);
            aID = incString.next(aID);
          }
        }
      }

      for (const archiveID of deletions) {
        t.delete(archivesRef.doc(archiveID));
      }

      {
        const data = {
          announceID,
          archives: newArchives,
          uT: FieldValue.serverTimestamp(),
        };
        t.set(immediateRef, data);
      }
    });
  }

  setHourlyNotification(
    announceID: string,
    hour: number,
    token: string,
    lang: Lang,
    prevHour?: number,
  ) {
    const data = {
      announceID,
      [`followers.${token}`]: prevHour == null ? [lang] : [lang, prevHour],
      unfollows: FieldValue.arrayRemove(token),
      uT: FieldValue.serverTimestamp(),
    };
    this.batch.set(this.firestore.doc(`notification-hourly/${announceID}-${hour}`), data, {
      merge: true,
    });
  }

  unsetHourlyNotification(announceID: string, hour: number, token: string) {
    const data = {
      [`followers.${token}`]: FieldValue.delete(),
      unfollows: FieldValue.arrayUnion(token),
    };
    this.batch.set(this.firestore.doc(`notification-hourly/${announceID}-${hour}`), data, {
      merge: true,
    });
  }
}

const genUpdators = (
  token: string,
  follower: NotificationFollower,
  firestore: FirestoreUpdator,
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
        return firestore.setImmediateNotification(announceID, token, follower.lang);
      };
      const remove = () => {
        return firestore.unsetImmediateNotification(announceID, token);
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
          return firestore.setHourlyNotification(announceID, hour, token, follower.lang, prevHour);
        };
        const remove = () => {
          return firestore.unsetHourlyNotification(announceID, hour, token);
        };
        result.push({ prefix, update, remove });
      });
    }
  }
  return result;
};

const updateSummary = async (
  token: string,
  before: NotificationFollower | null,
  current: NotificationFollower,
  adminApp: admin.app.App,
) => {
  const firestore = new FirestoreUpdator(adminApp.firestore());

  const updators = genUpdators(token, current, firestore);
  if (before) {
    const prefixSet = new Set(
      updators.map(v => {
        return v.prefix;
      }),
    );
    const beforeUpdators = genUpdators(token, before, firestore);
    for (const updator of beforeUpdators) {
      if (!prefixSet.has(updator.prefix)) {
        updator.remove();
      }
    }
  }

  for (const updator of updators) {
    updator.update();
  }

  await firestore.commit();
};

export const firestoreNotificationFollowerCreate = (
  qds: QueryDocumentSnapshot,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  return updateSummary(qds.id, null, qds.data() as NotificationFollower, adminApp);
};

export const firestoreNotificationFollowerUpdate = (
  change: Change<QueryDocumentSnapshot>,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  return updateSummary(
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
