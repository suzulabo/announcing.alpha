import * as admin from 'firebase-admin';
import { Request, Response } from 'firebase-functions';
import { converters } from './firestore';

const cacheControl = 'public, max-age=31556952, s-maxage=86400, immutable';
const announcePattern = /^\/dt\/a\/([0-9A-Z]{12})\/(m|p)\/([0-9A-Za-z]{1,8})$/;
const imagePattern = /^\/dt\/i\/([0-9A-Za-z]{22})$/;

export const httpsGetAnnounceData = async (
  req: Request,
  res: Response,
  adminApp: admin.app.App,
) => {
  console.log(req.path);
  const m = announcePattern.exec(req.path);
  if (!m) {
    res.sendStatus(400);
    return;
  }
  const [, id, _sub, subId] = m;
  const sub = _sub == 'm' ? 'meta' : 'posts';
  const converter: admin.firestore.FirestoreDataConverter<unknown> =
    _sub == 'm' ? converters.announceMeta : converters.post;

  const firestore = admin.firestore();
  const docRef = firestore.doc(`announces/${id}/${sub}/${subId}`).withConverter(converter);
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
