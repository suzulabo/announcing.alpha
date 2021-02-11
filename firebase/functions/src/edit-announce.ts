import { EditAnnounceParams } from 'announsing-shared';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { announceMetaHash, AnnounceMeta_FS, converters } from './firestore';

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
  if (!params.id) {
    throw new Error('missing id');
  }
  if (!params.name) {
    throw new Error('missing name');
  }
  if (params.name.length > 50) {
    throw new Error('name is too long');
  }
  if (params.desc && params.desc.length > 500) {
    throw new Error('desc is too long');
  }
  if (params.link && params.link.length > 500) {
    throw new Error('link is too long');
  }

  const firestore = adminApp.firestore();

  const { name, desc, link } = params;
  const newMeta: AnnounceMeta_FS = {
    name,
    ...(!!desc && { desc }),
    ...(!!link && { link }),
    cT: admin.firestore.FieldValue.serverTimestamp(),
  };
  const newMetaID = announceMetaHash(newMeta);

  console.log('newMeta', params.id, newMeta);

  const docRef = firestore.doc(`announces/${params.id}`).withConverter(converters.announce);
  const curData = (await docRef.get()).data();
  if (!curData) {
    console.log('no data', params.id);
    return;
  }
  if (curData.mid == newMetaID) {
    console.log('same meta', curData.mid, newMetaID);
    return;
  }

  const batch = firestore.batch();
  batch.create(firestore.doc(`announces/${params.id}/meta/${newMetaID}`), newMeta);
  batch.update(docRef, { mid: newMetaID });
  batch.delete(firestore.doc(`announces/${params.id}/meta/${curData.mid}`));
  await batch.commit();
};
