import { AppEnv } from 'announsing-shared';
import { initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { callCreateAnnounce } from './create-announce';

const adminApp = initializeApp();
const appEnv = new AppEnv().env;

const region = functions.region(appEnv.functionsRegion);

export const createAnnounce = region.https.onCall(async (data, context) => {
  return callCreateAnnounce(data, context, adminApp);
});
