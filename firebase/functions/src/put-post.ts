import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/lib/providers/https';
import { Announce_FS, checkOwner, converters, Post_FS, storeImage } from './firestore';
import { incString } from './incstring';
import { PutPostParams } from './shared';

export const callPutPost = async (
  params: PutPostParams,
  context: CallableContext,
  adminApp: admin.app.App,
): Promise<void> => {
  const uid = context.auth?.uid;
  return putPost(params, uid, adminApp);
};

const putPost = async (
  params: PutPostParams,
  uid: string | undefined,
  adminApp: admin.app.App,
): Promise<void> => {
  if (!uid) {
    throw new Error('missing uid');
  }

  const { id, title, body, link, imgData, editID } = params;
  if (!id) {
    throw new Error('missing id');
  }
  if (!body) {
    throw new Error('missing body');
  }
  if (body.length > 500) {
    throw new Error('body is too long');
  }
  if (title && title.length > 50) {
    throw new Error('title is too long');
  }
  if (link && link.length > 500) {
    throw new Error('link is too long');
  }
  if (imgData && imgData.length > 1024 * 1024) {
    throw new Error('imgData is too long');
  }

  const firestore = adminApp.firestore();

  {
    const isOwner = await checkOwner(firestore, uid, id);
    if (!isOwner) {
      return;
    }
  }

  const postData: Post_FS = {
    ...(!!title && { title }),
    body,
    ...(!!link && { link }),
    pT: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (editID) {
    const postRef = firestore.doc(`announces/${id}/posts/${editID}`).withConverter(converters.post);
    const data = (await postRef.get()).data();
    if (!data) {
      throw new Error(`missing edit data: ${id}/${editID}`);
    }
    postData.pT = admin.firestore.Timestamp.fromMillis(data.pT);
  }

  await firestore.runTransaction<void>(async t => {
    const announceRef = firestore.doc(`announces/${id}`).withConverter(converters.announce);
    const announceData = (await t.get(announceRef)).data();
    if (!announceData) {
      console.log('no data', id);
      return;
    }

    const postID = incString.next(announceData.pid);
    const posts = announceData.posts || [];

    if (imgData) {
      const imgID = await storeImage(firestore, imgData);
      if (imgID) {
        postData.img = imgID;
      }
    }

    t.create(announceRef.collection('posts').doc(postID), postData);

    if (editID) {
      const idx = posts.indexOf(editID);
      posts[idx] = postID;
      t.delete(announceRef.collection('posts').doc(editID));
    } else {
      posts.push(postID);
    }

    {
      const updateData: Partial<Announce_FS> = {
        pid: postID,
        posts,
        uT: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.update(announceRef, updateData);
    }
  });
};
