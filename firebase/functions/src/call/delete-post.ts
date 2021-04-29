import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { Announce, DeletePostParams } from '../shared';
import { checkOwner } from '../utils/firestore';
import { logger } from '../utils/logger';

export const callDeletePost = async (
  params: DeletePostParams,
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
    if (!announceData.posts || announceData.posts.indexOf(postID) < 0) {
      logger.debug('no post data', { id, postID });
      return;
    }

    t.delete(announceRef.collection('posts').doc(postID));
    {
      const updateData = {
        posts: admin.firestore.FieldValue.arrayRemove(postID),
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.update(announceRef, updateData);
    }
  });
};
