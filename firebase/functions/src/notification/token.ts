import * as admin from 'firebase-admin';
import { converters } from '../utils/firestore';
import { toMD5Base62 } from '../utils/util';

const tokenMap = new Map<string, string>();

export const getTokenHash = async (token: string, firestore: admin.firestore.Firestore) => {
  const hash = toMD5Base62(token).substring(0, 10);
  const cachedToken = tokenMap.get(hash);
  if (cachedToken) {
    if (cachedToken == token) {
      return hash;
    } else {
      throw new Error(`Collision? [${hash}](${token} : ${cachedToken})`);
    }
  }

  const qs = await firestore
    .collection('fcmtokens')
    .withConverter(converters.fcmToken)
    .where(hash, '>', '')
    .limit(1)
    .get();
  if (qs.size > 0) {
    const data = qs.docs[0].data();
    Object.entries(data).forEach(([k, v]) => {
      tokenMap.set(k, v);
    });
    const storedToken = data[hash];
    if (token != storedToken) {
      throw new Error(`Collision? [${hash}](${token} : ${storedToken})`);
    }
    return hash;
  }

  await firestore.doc(`fcmtokens/0`).set({ [hash]: token }, { merge: true });

  tokenMap.set(hash, token);

  return hash;
};
