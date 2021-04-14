import _cors from 'cors';
import { initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { config, Request, Response } from 'firebase-functions';
import { callCreateAnnounce } from './data/create-announce';
import { callDeleteAnnounce, firestoreDeleteAnnounce } from './data/delete-announce';
import { callDeletePost } from './data/delete-post';
import { callEditAnnounce } from './data/edit-announce';
import {
  httpsGetAnnounceMetaData,
  httpsGetAnnouncePostData,
  httpsGetImageData,
} from './data/get-data';
import { callRegisterNotification } from './notification/notification';
import { callPutPost } from './data/put-post';
import { AppEnv } from './shared';

const adminApp = initializeApp();
const appEnv = new AppEnv().env;
const cors = _cors({ origin: config().cors.origin });

const region = functions.region(appEnv.functionsRegion);

export const createAnnounce = region.https.onCall(async (data, context) => {
  return callCreateAnnounce(data, context, adminApp);
});
export const editAnnounce = region.https.onCall(async (data, context) => {
  return callEditAnnounce(data, context, adminApp);
});
export const deleteAnnounce = region.https.onCall(async (data, context) => {
  return callDeleteAnnounce(data, context, adminApp);
});
export const putPost = region.https.onCall(async (data, context) => {
  return callPutPost(data, context, adminApp);
});
export const deletePost = region.https.onCall(async (data, context) => {
  return callDeletePost(data, context, adminApp);
});
export const registerNotification = region.https.onCall(async (data, context) => {
  return callRegisterNotification(data, context, adminApp);
});

type httpsHandler = (
  req: Request,
  res: Response,
  adminApp: ReturnType<typeof initializeApp>,
) => Promise<void>;
const onHttpsRequest = (handler: httpsHandler) => {
  return region.https.onRequest(async (req, res) => {
    try {
      cors(req, res, () => {});
      await handler(req, res, adminApp);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });
};

export const getAnnounceMetaData = onHttpsRequest(httpsGetAnnounceMetaData);
export const getAnnouncePostData = onHttpsRequest(httpsGetAnnouncePostData);
export const getImageData = onHttpsRequest(httpsGetImageData);

export const onFirestoreDeleteAnnounce = region.firestore
  .document('announces/{announceID}')
  .onDelete((qs, context) => {
    return firestoreDeleteAnnounce(qs, context, adminApp);
  });
