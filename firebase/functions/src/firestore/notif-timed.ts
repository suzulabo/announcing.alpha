import admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Lang } from 'src/shared';
import { TimedNotification, TimedNotificationArchive } from '../utils/datatypes';
import { incString } from '../utils/incstring';
import { logger } from '../utils/logger';

const SHOULD_ARCHIVE_SIZE = 1024 * 1024 * 0.8;

const getFollowsSize = (
  data: [lang: Lang, follows: { [announceID: string]: [hoursBefore?: number] }],
) => {
  const [, follows] = data;
  if (!follows) {
    return 3;
  } else {
    return 3 + Object.keys(follows).length * 21; // 12+1 + 8
  }
};

const getFollowersSize = (data: TimedNotification['followers']) => {
  if (!data) {
    return 0;
  }
  return Object.entries(data).reduce((n, a) => {
    const [token, v] = a;
    return n + token.length + 1 + getFollowsSize(v);
  }, 0);
};

const shouldArchive = (data: TimedNotification) => {
  const followersSize = getFollowersSize(data.followers);
  const unfollowersSize = data.unfollows
    ? data.unfollows.reduce((a, v) => {
        return a + v.length;
      }, 0)
    : 0;
  if (followersSize + unfollowersSize > SHOULD_ARCHIVE_SIZE) {
    logger.debug('shouldArchive', { followersSize, unfollowersSize });
    return true;
  }

  return false;
};

const archiveTimedNotification = async (firestore: admin.firestore.Firestore, time: number) => {
  const padTime = time.toString().padStart(4, '0');

  await firestore.runTransaction(async t => {
    const timedRef = firestore.doc(`notif-timed/${padTime}`);
    const timed = (await t.get(timedRef)).data() as TimedNotification;
    if (!timed) {
      return;
    }
    const followers = timed.followers || {};
    const unfollows = timed.unfollows || [];
    const archives = timed.archives || [];
    if (!shouldArchive(timed)) {
      return;
    }

    const archiveFollowers = [] as [string, TimedNotificationArchive['followers'][string]][];
    const reuses = [] as string[];
    const deletions = [] as string[];
    const archivesRef = timedRef.collection('archives');
    for (const archiveID of archives) {
      const archive = (await archivesRef.doc(archiveID).get()).data() as TimedNotificationArchive;
      if (!archive) {
        logger.warn(`missing archive ${padTime}-${archiveID}`);
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
      let aID = incString.next(incString.max(newArchives));
      let dataSize = 0;
      let dataFollowers = [] as [string, TimedNotificationArchive['followers'][string]][];
      while (archiveFollowers.length > 0) {
        const [token, v] = archiveFollowers.shift()!;
        dataFollowers.push([token, v]);
        dataSize += token.length + 1 + getFollowsSize(v);
        const doArchive = dataSize > SHOULD_ARCHIVE_SIZE || archiveFollowers.length == 0;
        if (!doArchive) {
          continue;
        }

        const data: TimedNotificationArchive = {
          followers: Object.fromEntries(dataFollowers),
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

        dataFollowers = [];
        dataSize = 0;
      }
    }

    for (const archiveID of deletions) {
      t.delete(archivesRef.doc(archiveID));
    }

    {
      const data = {
        time,
        archives: newArchives,
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.set(timedRef, data);
    }
  });
};

const deleteArchives = async (
  firestore: admin.firestore.Firestore,
  time: number,
  archives: string[],
) => {
  const padTime = time.toString().padStart(4, '0');
  while (archives.length > 0) {
    const ids = archives.splice(0, 500);
    const batch = firestore.batch();
    for (const id of ids) {
      batch.delete(firestore.doc(`notif-imm/${padTime}/archives/${id}`));
    }
    await batch.commit();
  }
};

export const firestoreTimedNotificationWrite = async (
  change: Change<DocumentSnapshot>,
  context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const firestore = adminApp.firestore();
  if (change.after) {
    // create, update
    const timed = change.after.data() as TimedNotification;
    if (!shouldArchive(timed)) {
      return;
    }
    await archiveTimedNotification(firestore, timed.time);
  } else {
    // delete
    const timed = change.before.data() as TimedNotification;
    if (timed.archives) {
      await deleteArchives(firestore, timed.time, timed.archives);
    }
  }
};
