import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { AnnounceMetaRule, EditAnnounceParams, ImageRule } from '../shared';
import { announceMetaHash, AnnounceMeta_FS, Announce_FS, converters } from '../utils/firestore';
import { logger } from '../utils/logger';
import { toMD5Base62 } from '../utils/util';

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
  if (newIcon && newIcon.length > ImageRule.d.length) {
    throw new Error('newIcon is too long');
  }

  const firestore = adminApp.firestore();

  {
    const userRef = firestore.doc(`users/${uid}`).withConverter(converters.user);
    const userData = (await userRef.get()).data();
    if (!userData) {
      logger.warn('no user', uid);
      return;
    }
    if (!userData.announces || userData.announces.indexOf(id) < 0) {
      logger.warn('not owner', { uid, id });
      return;
    }
  }

  const newMeta: AnnounceMeta_FS = {
    name,
    ...(!!desc && { desc }),
    ...(!!link && { link }),
    ...(!!icon && { icon }),
    cT: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (newIcon) {
    const img = Buffer.from(newIcon, 'base64');
    const newIconID = toMD5Base62(img);

    const imgRef = firestore.doc(`images/${newIconID}`);
    const doc = await imgRef.get();
    if (!doc.exists) {
      await imgRef.create({ d: img });
    }
    newMeta.icon = newIconID;
  }

  const newMetaID = announceMetaHash(newMeta);

  const updateAnnounce: Partial<Announce_FS> = {
    mid: newMetaID,
    uT: admin.firestore.FieldValue.serverTimestamp(),
  };

  const announceRef = firestore.doc(`announces/${id}`).withConverter(converters.announce);
  const announceData = (await announceRef.get()).data();
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
