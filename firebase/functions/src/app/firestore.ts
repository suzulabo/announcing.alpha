import admin from 'firebase-admin';
import { AnnounceMeta, Lang } from '../shared';
import { Cache, MISS } from '../utils/cache';
import { ImmediateNotification, ImmediateNotificationArchive } from '../utils/datatypes';
import { converters } from '../utils/firestore';
import { incString } from '../utils/incstring';
import { logger } from '../utils/logger';

import FieldValue = admin.firestore.FieldValue;

const announceMetaCache = new Cache<AnnounceMeta>();

export class __AppFirestore {
  constructor(private firestore: admin.firestore.Firestore) {}

  private _batch: admin.firestore.WriteBatch | undefined;
  private get batch() {
    if (!this._batch) {
      this._batch = this.firestore.batch();
    }
    return this._batch;
  }

  async commit() {
    if (this._batch) {
      await this._batch.commit();
      this._batch = undefined;
    }
  }

  async getAnnounce(announceID: string) {
    return (
      await this.firestore.doc(`announces/${announceID}`).withConverter(converters.announce).get()
    ).data();
  }

  async getAnnounceMeta(announceID: string, metaID: string) {
    const cacheKey = `${announceID}-${metaID}`;
    {
      const v = announceMetaCache.get(cacheKey);
      if (v == null) {
        return v;
      }
      if (v == MISS) {
        return;
      }
    }
    const data = (
      await this.firestore
        .doc(`announces/${announceID}/meta/${metaID}`)
        .withConverter(converters.announceMeta)
        .get()
    ).data();
    if (data) {
      announceMetaCache.set(cacheKey, data);
      return data;
    } else {
      announceMetaCache.set(cacheKey, MISS);
      return;
    }
  }

  setNotificationFollower(token: string, lang: Lang, follows: { id: string; hours?: number[] }[]) {
    const data = {
      lang,
      follows,
      uT: FieldValue.serverTimestamp(),
    };
    this.batch.set(this.firestore.doc(`notification-followers/${token}`), data);
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

  async getImmediateNotificationFollowers(announceID: string) {
    const immediateRef = this.firestore.doc(`notification-immediate/${announceID}`);
    const immediate = (await immediateRef.get()).data() as ImmediateNotification;
    if (!immediate) {
      return;
    }

    const followers = [] as [string, [lang: Lang]][];
    if (immediate.archives) {
      const archivesRef = immediateRef.collection('archives');
      for (const archiveID of immediate.archives) {
        const archive = (
          await archivesRef.doc(archiveID).get()
        ).data() as ImmediateNotificationArchive;
        if (archive) {
          followers.push(...Object.entries(archive.followers));
        }
      }
    }

    if (immediate.followers) {
      followers.push(...Object.entries(immediate.followers));
    }

    if (!immediate.unfollows) {
      return new Map(followers);
    } else {
      const filtered = followers.filter(([token]) => {
        return !immediate.unfollows!.includes(token);
      });
      return new Map(filtered);
    }
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
      uT: FieldValue.serverTimestamp(),
    };
    this.batch.set(this.firestore.doc(`notification-hourly/${announceID}-${hour}`), data, {
      merge: true,
    });
  }

  unsetHourlyNotification(announceID: string, hour: number, token: string) {
    const data = {
      [`followers.${token}`]: FieldValue.delete(),
      uT: FieldValue.serverTimestamp(),
    };
    this.batch.set(this.firestore.doc(`notification-hourly/${announceID}-${hour}`), data, {
      merge: true,
    });
  }

  /*
  async getNotificationFollowers(announceID: string, hour: number) {
    const scheduleRef = this.firestore.doc(`notification-schedule/${announceID}-${hour}`);
    const schedule = (await scheduleRef.get()).data() as NotificationSchedule;
    if (!schedule) {
      return;
    }

    const archivesRef = scheduleRef.collection('archives');
    const followers = [] as [string, NotificationSchedule['followers'][string]][];
    if (schedule.archives) {
      for (const archiveID of schedule.archives) {
        const archive = (
          await archivesRef.doc(archiveID).get()
        ).data() as NotificationScheduleArchive;
        if (archive) {
          followers.push(...Object.entries(archive.followers));
        }
      }
    }
    followers.push(...Object.entries(schedule.followers));

    if (!schedule.unfollows) {
      return new Map(followers);
    } else {
      const filtered = followers.filter(([token]) => {
        return !schedule.unfollows?.includes(token);
      });
      return new Map(filtered);
    }
  }

  async *getNotificationSchedules(hour: number): AsyncGenerator<NotificationSchedule> {
    const notificationScheduleRef = this.firestore.collection('notification-schedule');
    const q = notificationScheduleRef.where('hour', '==', hour).orderBy('announceID').limit(1000);

    let last = undefined;
    while (true) {
      const qs = await q.startAfter(last).get();
      if (qs.empty) {
        break;
      }
      for (const doc of qs.docs) {
        yield doc.data() as NotificationSchedule;
        last = doc.ref;
      }
    }
  }
  */
}
