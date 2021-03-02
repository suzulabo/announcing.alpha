import { AppEnv } from 'announsing-shared';
import { initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { callCreateAnnounce } from './create-announce';
import { callDeleteAnnounce, firestoreDeleteAnnounce } from './delete-announce';
import { callDeletePost } from './delete-post';
import { callEditAnnounce } from './edit-announce';
import { httpsGetAnnounceData, httpsGetImageData } from './get-data';
import { callPutPost } from './put-post';

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

export const getAnnounceData = region.https.onRequest(async (req, res) => {
  try {
    await httpsGetAnnounceData(req, res, adminApp);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export const getImageData = region.https.onRequest(async (req, res) => {
  try {
    await httpsGetImageData(req, res, adminApp);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export const onFirestoreDeleteAnnounce = region.firestore
  .document('announces/{announceID}')
  .onDelete((qs, context) => {
    return firestoreDeleteAnnounce(qs, context, adminApp);
  });
