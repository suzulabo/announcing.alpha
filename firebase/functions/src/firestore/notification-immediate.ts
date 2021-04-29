// TODO later!!
/*
class FirestoreUpdator {
  private batch: admin.firestore.WriteBatch;
  constructor(private firestore: admin.firestore.Firestore) {
    this.batch = this.firestore.batch();
  }

  commit() {
    return this.batch.commit();
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

}
*/
