import { EditAnnounceParams } from 'announsing-shared';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { announceMetaHash, AnnounceMeta_FS, Announce_FS, converters } from './firestore';

export const callEditAnnounce = async (
  params: EditAnnounceParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  return editAnnounce(params, uid, adminApp);
};

const editAnnounce = async (
  params: EditAnnounceParams,
  uid: string | undefined,
  adminApp: admin.app.App,
): Promise<void> => {
  if (!uid) {
    throw new Error('missing uid');
  }

  const { id, name, desc, link } = params;
  if (!id) {
    throw new Error('missing id');
  }
  if (!name) {
    throw new Error('missing name');
  }
  if (name.length > 50) {
    throw new Error('name is too long');
  }
  if (desc && desc.length > 500) {
    throw new Error('desc is too long');
  }
  if (link && link.length > 500) {
    throw new Error('link is too long');
  }

  const firestore = adminApp.firestore();

  const newMeta: AnnounceMeta_FS = {
    name,
    ...(!!desc && { desc }),
    ...(!!link && { link }),
    cT: admin.firestore.FieldValue.serverTimestamp(),
  };
  const newMetaID = announceMetaHash(newMeta);

  const updateData: Partial<Announce_FS> = {
    mid: newMetaID,
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };

  console.log('newMeta', id, newMeta);

  const docRef = firestore.doc(`announces/${id}`).withConverter(converters.announce);
  const curData = (await docRef.get()).data();
  if (!curData) {
    console.log('no data', id);
    return;
  }
  if (!curData.users[uid]?.own) {
    console.log('not owner', id, uid);
    return;
  }
  if (curData.mid == newMetaID) {
    console.log('same meta', curData.mid, newMetaID);
    return;
  }

  const batch = firestore.batch();
  batch.create(firestore.doc(`announces/${id}/meta/${newMetaID}`), newMeta);
  batch.update(docRef, updateData);
  batch.delete(firestore.doc(`announces/${id}/meta/${curData.mid}`));
  await batch.commit();
};
