import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { DeletePostParams } from '../shared';
import { Announce_FS, checkOwner, converters } from '../utils/firestore';

export const callDeletePost = async (
  params: DeletePostParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  return deletePost(params, uid, adminApp);
};

const deletePost = async (
  params: DeletePostParams,
  uid: string | undefined,
  adminApp: admin.app.App,
): Promise<void> => {
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
    const announceRef = firestore.doc(`announces/${id}`).withConverter(converters.announce);
    const announceData = (await t.get(announceRef)).data();
    if (!announceData) {
      console.log('no data', id);
      return;
    }
    if (!announceData.posts || announceData.posts.indexOf(postID) < 0) {
      console.log('no post data', id, postID);
      return;
    }

    t.delete(announceRef.collection('posts').doc(postID));
    {
      const updateData: Partial<Announce_FS> = {
        posts: admin.firestore.FieldValue.arrayRemove(postID),
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.update(announceRef, updateData);
    }
  });
};
