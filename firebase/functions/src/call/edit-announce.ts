import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { Announce, AnnounceMetaRule, EditAnnounceParams, ImageRule } from '../shared';
import { announceMetaHash, checkOwner, storeImage } from '../utils/firestore';
import { logger } from '../utils/logger';

export const callEditAnnounce = async (
  params: Partial<EditAnnounceParams>,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new Error('missing uid');
  }

  const { id, name, desc, link, icon, newIcon } = params;
  if (!id) {
    throw new Error('missing id');
  }
  if (!name) {
    throw new Error('missing name');
  }
  if (name.length > AnnounceMetaRule.name.length) {
    throw new Error('name is too long');
  }
  if (desc && desc.length > AnnounceMetaRule.desc.length) {
    throw new Error('desc is too long');
  }
  if (link && link.length > AnnounceMetaRule.link.length) {
    throw new Error('link is too long');
  }
  if (newIcon && newIcon.length > ImageRule.data.length) {
    throw new Error('newIcon is too long');
  }

  const firestore = adminApp.firestore();

  {
    const isOwner = await checkOwner(firestore, uid, id);
    if (!isOwner) {
      return;
    }
  }

  const newMeta = {
    name,
    ...(!!desc && { desc }),
    ...(!!link && { link }),
    ...(!!icon && { icon }),
    cT: admin.firestore.FieldValue.serverTimestamp() as any,
  };

  if (newIcon) {
    const imgID = await storeImage(firestore, newIcon);
    if (imgID) {
      newMeta.icon = imgID;
    }
  }

  const newMetaID = announceMetaHash(newMeta);

  const updateAnnounce = {
    mid: newMetaID,
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const announceRef = firestore.doc(`announces/${id}`);
  const announceData = (await announceRef.get()).data() as Announce;
  if (!announceData) {
    logger.debug('no data', id);
    return;
  }
  if (announceData.mid == newMetaID) {
    logger.debug('same meta', { mid: announceData.mid, newMetaID });
    return;
  }

  const batch = firestore.batch();
  batch.create(firestore.doc(`announces/${id}/meta/${newMetaID}`), newMeta);
  batch.update(announceRef, updateAnnounce);
  batch.delete(firestore.doc(`announces/${id}/meta/${announceData.mid}`));
  await batch.commit();
};
