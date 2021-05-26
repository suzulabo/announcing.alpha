import { initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Request, Response } from 'firebase-functions';
import 'firebase-functions/lib/logger/compat';
import { callCreateAnnounce } from './call/create-announce';
import { callDeleteAnnounce } from './call/delete-announce';
import { callDeletePost } from './call/delete-post';
import { callEditAnnounce } from './call/edit-announce';
import { callPutPost } from './call/put-post';
import { callRegisterNotification } from './call/register-notification';
import { firestoreDeleteAnnounce } from './firestore/announce';
import { firestoreNotificationDeviceWrite } from './firestore/notif-devices';
import { firestoreImmediateNotificationWrite } from './firestore/notif-imm';
import { firestoreCreatePost } from './firestore/post';
import {
  httpsGetAnnounceMetaData,
  httpsGetAnnouncePostData,
  httpsGetImageData,
} from './https/get-data';
import { pubsubSendNotification } from './pubsub/send-notification';
import { AppEnv } from './shared';

const adminApp = initializeApp();
const appEnv = new AppEnv().env;

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
    await handler(req, res, adminApp);
  });
};

export const getAnnounceMetaData = onHttpsRequest(httpsGetAnnounceMetaData);
export const getAnnouncePostData = onHttpsRequest(httpsGetAnnouncePostData);
export const getImageData = onHttpsRequest(httpsGetImageData);

export const onFirestoreDeleteAnnounce = region.firestore
  .document('announces/{announceID}')
  .onDelete((qds, context) => {
    return firestoreDeleteAnnounce(qds, context, adminApp);
  });

export const onFirestoreCreatePost = region.firestore
  .document('announces/{announceID}/posts/{postID}')
  .onCreate((qds, context) => {
    return firestoreCreatePost(qds, context, adminApp);
  });

export const onFirestoreNotificationDeviceWrite = region.firestore
  .document('notif-devices/{token}')
  .onWrite((change, context) => {
    return firestoreNotificationDeviceWrite(change, context, adminApp);
  });

export const onFirestoreImmediateNotificationWrite = region.firestore
  .document('notif-imm/{announceID}')
  .onWrite((change, context) => {
    return firestoreImmediateNotificationWrite(change, context, adminApp);
  });

export const onPubsubSendNotification = region
  .runWith({ failurePolicy: true })
  .pubsub.topic('send-notification')
  .onPublish(async (msg, context) => {
    await pubsubSendNotification(msg, context, adminApp);
    return 0;
  });
