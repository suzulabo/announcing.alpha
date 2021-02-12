import { AppEnv } from 'announsing-shared';
import { initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { callCreateAnnounce } from './create-announce';
import { callDeleteAnnounce } from './delete-announce';
import { callEditAnnounce } from './edit-announce';

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
