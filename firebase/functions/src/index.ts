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
import { callPutPost } from './data/put-post';
import { pubsubSendNotification } from './notification/pubsub';
import { callRegisterNotification } from './notification/register';
import { firestoreCreatePost } from './notification/send';
import { pubsubHourly } from './notification/send-hourly';
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

export const onFirestoreCreatePost = region.firestore
  .document('announces/{announceID}/posts/{postID}')
  .onCreate((qs, context) => {
    return firestoreCreatePost(qs, context, adminApp);
  });

export const onPubsubSendNotification = region.pubsub
  .topic('send-notification')
  .onPublish(async (msg, context) => {
    await pubsubSendNotification(msg, context, adminApp);
    return 0;
  });

const hourlyTask = (hour: number) => {
  return region.pubsub
    .schedule(`0 0 ${hour} * *`)
    .timeZone('UTC')
    .onRun(async context => {
      await pubsubHourly(hour, context, adminApp);
    });
};

export const onPubsubHourly0 = hourlyTask(0);
export const onPubsubHourly1 = hourlyTask(1);
export const onPubsubHourly2 = hourlyTask(2);
export const onPubsubHourly3 = hourlyTask(3);
export const onPubsubHourly4 = hourlyTask(4);
export const onPubsubHourly5 = hourlyTask(5);
export const onPubsubHourly6 = hourlyTask(6);
export const onPubsubHourly7 = hourlyTask(7);
export const onPubsubHourly8 = hourlyTask(8);
export const onPubsubHourly9 = hourlyTask(9);
export const onPubsubHourly10 = hourlyTask(10);
export const onPubsubHourly11 = hourlyTask(11);
export const onPubsubHourly12 = hourlyTask(12);
export const onPubsubHourly13 = hourlyTask(13);
export const onPubsubHourly14 = hourlyTask(14);
export const onPubsubHourly15 = hourlyTask(15);
export const onPubsubHourly16 = hourlyTask(16);
export const onPubsubHourly17 = hourlyTask(17);
export const onPubsubHourly18 = hourlyTask(18);
export const onPubsubHourly19 = hourlyTask(19);
export const onPubsubHourly20 = hourlyTask(20);
export const onPubsubHourly21 = hourlyTask(21);
export const onPubsubHourly22 = hourlyTask(22);
export const onPubsubHourly23 = hourlyTask(23);
