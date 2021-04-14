import * as admin from 'firebase-admin';
import { Request, Response } from 'firebase-functions';
import { converters } from '../utils/firestore';

const cacheControl = 'public, max-age=31556952, s-maxage=86400, immutable';
const announceMetaPattern = new RegExp('^/announce/([a-zA-Z0-9]{12})/meta/([a-zA-Z0-9]{8})$');
const announcePostPattern = new RegExp('^/announce/([a-zA-Z0-9]{12})/post/([-a-zA-Z0-9]{10,20})$');
const imagePattern = new RegExp('^/image/([a-zA-Z0-9]{22})$');

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

  const firestore = admin.firestore();
  const docRef = firestore
    .doc(`announces/${id}/meta/${metaID}`)
    .withConverter(converters.announceMeta);
  const data = (await docRef.get()).data();
  if (!data) {
    res.sendStatus(404);
    return;
  }

  res.setHeader('Cache-Control', cacheControl);
  res.json(data);
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

  const firestore = admin.firestore();
  const docRef = firestore.doc(`announces/${id}/posts/${postID}`).withConverter(converters.post);
  const data = (await docRef.get()).data();
  if (!data) {
    res.sendStatus(404);
    return;
  }

  res.setHeader('Cache-Control', cacheControl);
  res.json(data);
};

export const httpsGetImageData = async (req: Request, res: Response, adminApp: admin.app.App) => {
  const m = imagePattern.exec(req.path);
  if (!m) {
    res.sendStatus(400);
    return;
  }

  const [, id] = m;

  const firestore = admin.firestore();
  const docRef = firestore.doc(`images/${id}`);
  const data = (await docRef.get()).data();
  if (!data) {
    res.sendStatus(404);
    return;
  }

  const img = data.d as Buffer;

  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(img).end();
};