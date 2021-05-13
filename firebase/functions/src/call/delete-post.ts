import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { Announce, DeletePostParams } from '../shared';
import { checkOwner } from '../utils/firestore';
import { logger } from '../utils/logger';

export const callDeletePost = async (
  params: Partial<DeletePostParams>,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new Error('missing uid');
  }

  const { id, postID } = params;
  if (!id) {
    throw new Error('missing id');
  }
  if (!postID) {
    throw new Error('missing postID');
  }

  const firestore = adminApp.firestore();

  {
    const isOwner = await checkOwner(firestore, uid, id);
    if (!isOwner) {
      return;
    }
  }

  await firestore.runTransaction<void>(async t => {
    const announceRef = firestore.doc(`announces/${id}`);
    const announceData = (await t.get(announceRef)).data() as Announce;
    if (!announceData) {
      logger.debug('no data', id);
      return;
    }
    if (!(postID in announceData.posts)) {
      logger.debug('no post data', { id, postID });
      return;
    }

    t.delete(announceRef.collection('posts').doc(postID));
    {
      const updateData = {
        [`posts.${postID}`]: admin.firestore.FieldValue.delete(),
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.update(announceRef, updateData);
    }
  });
};
