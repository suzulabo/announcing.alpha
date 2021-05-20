import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { Announce, ImageRule, Post, PostRule, PutPostParams } from '../shared';
import { checkOwner, postHash, storeImage } from '../utils/firestore';
import { logger } from '../utils/logger';

export const callPutPost = async (
  params: Partial<PutPostParams>,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;

  if (!uid) {
    throw new Error('missing uid');
  }

  const { id, title, body, link, imgData, editID } = params;
  if (!id) {
    throw new Error('missing id');
  }
  if (!title && !body) {
    throw new Error('missing title and body');
  }
  if (body && body.length > PostRule.body.length) {
    throw new Error('body is too long');
  }
  if (title && title.length > PostRule.title.length) {
    throw new Error('title is too long');
  }
  if (link && link.length > PostRule.link.length) {
    throw new Error('link is too long');
  }
  if (imgData && imgData.length > ImageRule.data.length) {
    throw new Error('imgData is too long');
  }

  const firestore = adminApp.firestore();

  {
    const isOwner = await checkOwner(firestore, uid, id);
    if (!isOwner) {
      logger.warn('not owner', { params });
      return;
    }
  }

  const now = admin.firestore.Timestamp.now();

  const postData: Post = {
    ...(!!title && { title }),
    ...(!!body && { body }),
    ...(!!link && { link }),
    pT: now,
  };

  if (editID) {
    const postRef = firestore.doc(`announces/${id}/posts/${editID}`);
    const data = (await postRef.get()).data() as Post;
    if (!data) {
      throw new Error(`missing edit data: ${id}/${editID}`);
    }
    postData.edited = editID;
    postData.pT = data.pT;
  }

  await firestore.runTransaction<void>(async t => {
    const announceRef = firestore.doc(`announces/${id}`);
    const announceData = (await t.get(announceRef)).data() as Announce;
    if (!announceData) {
      logger.debug('no data', id);
      return;
    }

    if (imgData) {
      const imgID = await storeImage(firestore, imgData);
      if (imgID) {
        postData.img = imgID;
      }
    }

    const postID = postHash(postData);
    if (postID in announceData.posts) {
      logger.warn('duplicate postID', { postID, params });
    }

    t.create(announceRef.collection('posts').doc(postID), postData);

    if (editID) {
      const updateData = {
        [`posts.${postID}`]: { pT: postData.pT },
        [`posts.${editID}`]: admin.firestore.FieldValue.delete(),
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.update(announceRef, updateData);
      t.delete(announceRef.collection('posts').doc(editID));
    } else {
      const updateData = {
        [`posts.${postID}`]: { pT: postData.pT },
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.update(announceRef, updateData);
    }
  });
};
