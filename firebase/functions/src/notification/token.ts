import * as admin from 'firebase-admin';
import { converters } from '../utils/firestore';
import { toMD5Base62 } from '../utils/util';

const tokenMap = new Map<string, string>();

export const getToken = async (hash: string, firestore: admin.firestore.Firestore) => {
  {
    const t = tokenMap.get(hash);
    if (t) {
      return t;
    }
  }

  const qs = await firestore
    .collection('fcmtokens')
    .withConverter(converters.fcmToken)
    .orderBy(hash)
    .limit(1)
    .get();
  if (qs.size > 0) {
    const data = qs.docs[0].data();
    Object.entries(data).forEach(([k, v]) => {
      tokenMap.set(k, v);
    });
  }

  return tokenMap.get(hash);
};

export const getTokenHash = async (token: string, firestore: admin.firestore.Firestore) => {
  const hash = toMD5Base62(token).substring(0, 10);
  const cachedToken = await getToken(hash, firestore);
  if (cachedToken) {
    if (cachedToken == token) {
      return hash;
    } else {
      throw new Error(`Collision? [${hash}](${token} : ${cachedToken})`);
    }
  }

  await firestore.doc(`fcmtokens/0`).set({ [hash]: token }, { merge: true });

  tokenMap.set(hash, token);

  return hash;
};
