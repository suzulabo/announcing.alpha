import * as admin from 'firebase-admin';
import { Request, Response } from 'firebase-functions';
import { AnnounceMeta, Post } from '../shared';
import { Cache } from '../utils/cache';

const cacheControl = 'public, max-age=31556952, s-maxage=86400, immutable';
const announceMetaPattern = new RegExp('^/data/announces/([a-zA-Z0-9]{12})/meta/([a-zA-Z0-9]{8})$');
const announcePostPattern = new RegExp(
  '^/data/announces/([a-zA-Z0-9]{12})/posts/([a-zA-Z0-9]{8})$',
);
const imagePattern = new RegExp('^/data/images/([a-zA-Z0-9]{15,25})$');

const cache = new Cache();

// eslint-disable-next-line @typescript-eslint/ban-types
const getCacheFirst = async <T extends object>(docRef: admin.firestore.DocumentReference) => {
  const v = cache.get(docRef.path);
  if (v) {
    return v as T;
  }

  const data = (await docRef.get()).data();
  if (!data) {
    return;
  }
  cache.set(docRef.path, data);
  return data as T;
};

export const httpsGetAnnounceMetaData = async (
  req: Request,
  res: Response,
  adminApp: admin.app.App,
) => {
  const m = announceMetaPattern.exec(req.path);
  if (!m) {
    res.sendStatus(400);
    return;
  }
  const [, id, metaID] = m;

  const firestore = adminApp.firestore();
  const docRef = firestore.doc(`announces/${id}/meta/${metaID}`);
  const data = await getCacheFirst<AnnounceMeta>(docRef);
  if (!data) {
    res.sendStatus(404);
    return;
  }

  res.setHeader('Cache-Control', cacheControl);
  res.json({ ...data, cT: data.cT.toMillis() });
};

export const httpsGetAnnouncePostData = async (
  req: Request,
  res: Response,
  adminApp: admin.app.App,
) => {
  const m = announcePostPattern.exec(req.path);
  if (!m) {
    res.sendStatus(400);
    return;
  }
  const [, id, postID] = m;

  const firestore = adminApp.firestore();
  const docRef = firestore.doc(`announces/${id}/posts/${postID}`);
  const data = await getCacheFirst<Post>(docRef);
  if (!data) {
    res.sendStatus(404);
    return;
  }

  res.setHeader('Cache-Control', cacheControl);
  res.json({ ...data, pT: data.pT.toMillis() });
};

export const httpsGetImageData = async (req: Request, res: Response, adminApp: admin.app.App) => {
  const m = imagePattern.exec(req.path);
  if (!m) {
    res.sendStatus(400);
    return;
  }

  const [, id] = m;

  const firestore = adminApp.firestore();
  const docRef = firestore.doc(`images/${id}`);
  const data = await getCacheFirst<{ data: Buffer }>(docRef);
  if (!data) {
    res.sendStatus(404);
    return;
  }

  const img = data.data;

  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(img).end();
};
