import * as admin from 'firebase-admin';
import { Request, Response } from 'firebase-functions';
import { converters } from './firestore';

export const httpsGetData = async (req: Request, res: Response, adminApp: admin.app.App) => {
  const d = await getData(req.path, adminApp);
  if (typeof d == 'number') {
    res.sendStatus(d);
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=31556952, s-maxage=86400, immutable');
  res.json(d);
};

const pathPattern = /^\/dt\/a\/([0-9A-Z]{12})\/(m|p)\/([0-9A-Za-z.-]{8})$/;

const getData = async (p: string, adminApp: admin.app.App) => {
  const m = pathPattern.exec(p);
  if (!m) {
    return 400;
  }

  const [, id, _sub, subId] = m;
  const sub = _sub == 'm' ? 'meta' : 'posts';
  const converter: admin.firestore.FirestoreDataConverter<unknown> =
    _sub == 'm' ? converters.announceMeta : converters.post;

  const firestore = admin.firestore();
  const docRef = firestore.doc(`announces/${id}/${sub}/${subId}`).withConverter(converter);
  const data = (await docRef.get()).data();
  if (!data) {
    return 404;
  }

  return data;
};
