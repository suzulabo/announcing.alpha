import admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { Lang } from '../shared';
import { ImmediateNotification, ImmediateNotificationArchive } from '../utils/datatypes';
import { incString } from '../utils/incstring';
import { logger } from '../utils/logger';

const SHOULD_ARCHIVE_COUNT = 5000;
const ARCHIVE_COUNT = 5000;

const shouldArchive = (data: ImmediateNotification) => {
  return (
    (data.devices ? Object.keys(data.devices).length : 0) +
      (data.cancels ? data.cancels.length : 0) >=
    SHOULD_ARCHIVE_COUNT
  );
};

const archiveImmediateNotification = async (
  firestore: admin.firestore.Firestore,
  announceID: string,
) => {
  await firestore.runTransaction(async t => {
    const immediateRef = firestore.doc(`notif-imm/${announceID}`);
    const immediate = (await t.get(immediateRef)).data() as ImmediateNotification;
    if (!immediate) {
      return;
    }
    const devices = immediate.devices || {};
    const cancels = immediate.cancels || [];
    const archives = immediate.archives || [];
    if (!shouldArchive(immediate)) {
      return;
    }

    const archiveDevices = [] as [string, [lang: Lang]][];
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

      const entries = Object.entries(archive.devices);
      const filtered = entries.filter(([token]) => {
        return !(token in devices) && !cancels.includes(token);
      });
      if (entries.length == filtered.length) {
        reuses.push(archiveID);
      } else {
        deletions.push(archiveID);
        archiveDevices.push(...filtered);
      }
    }

    archiveDevices.push(...Object.entries(devices));

    const newArchives = [...reuses];
    {
      let aID = incString.next(incString.max(newArchives));
      while (archiveDevices.length > 0) {
        const data: ImmediateNotificationArchive = {
          devices: Object.fromEntries(archiveDevices.splice(0, ARCHIVE_COUNT)),
        };
        const id = deletions.shift();
        if (id) {
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
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.set(immediateRef, data);
    }
  });
};

const deleteArchives = async (
  firestore: admin.firestore.Firestore,
  announceID: string,
  archives: string[],
) => {
  while (archives.length > 0) {
    const ids = archives.splice(0, 500);
    const batch = firestore.batch();
    for (const id of ids) {
      batch.delete(firestore.doc(`notif-imm/${announceID}/archives/${id}`));
    }
    await batch.commit();
  }
};

export const firestoreImmediateNotificationWrite = async (
  change: Change<DocumentSnapshot>,
  _context: EventContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const firestore = adminApp.firestore();
  if (change.after) {
    // create, update
    const imm = change.after.data() as ImmediateNotification;
    if (!shouldArchive(imm)) {
      return;
    }
    await archiveImmediateNotification(firestore, imm.announceID);
  } else {
    // delete
    const imm = change.before.data() as ImmediateNotification;
    if (imm.archives) {
      await deleteArchives(firestore, imm.announceID, imm.archives);
    }
  }
};
