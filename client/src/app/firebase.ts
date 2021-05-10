import { Build } from '@stencil/core';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/messaging';
import { Announce, AppEnv, Lang, RegisterNotificationParams } from 'src/shared';
import nacl from 'tweetnacl';
import { bs62 } from './utils';

const getCache = async <T>(docRef: firebase.firestore.DocumentReference): Promise<T> => {
  {
    try {
      const doc = await docRef.get({ source: 'cache' });
      if (doc.exists) {
        console.debug('hit cache:', docRef.path);
        return doc.data() as T;
      }
    } catch {}
  }
};

export class AppFirebase {
  private functions: firebase.functions.Functions;
  private firestore: firebase.firestore.Firestore;
  private messaging: firebase.messaging.Messaging;

  constructor(private appEnv: AppEnv, private _firebaseApp?: firebase.app.App) {}

  private devonly_setEmulator() {
    if (!Build.isDev) {
      return;
    }
    console.log('useEmulator');
    this.functions.useEmulator(location.hostname, parseInt(location.port));
    this.firestore.settings({ ssl: false, host: `${location.host}` });
  }

  async init() {
    if (this._firebaseApp) {
      return;
    }

    this._firebaseApp = firebase.initializeApp(this.appEnv.env.firebaseConfig);
    this.functions = this._firebaseApp.functions(this.appEnv.env.functionsRegion);
    this.firestore = this._firebaseApp.firestore();
    try {
      this.messaging = this._firebaseApp.messaging();
    } catch (err) {
      console.warn('create messaging', err);
    }
    this.devonly_setEmulator();

    try {
      await this.firestore.enablePersistence({ synchronizeTabs: true });
    } catch (err) {
      console.warn('enablePersistence', err);
    }
  }

  private async callFunc<T>(name: string, params: any): Promise<T> {
    const f = this.functions.httpsCallable(name);
    const res = await f(params);
    return res.data as T;
  }

  private listeners = (() => {
    const listenMap = new Map<string, () => void>();

    const add = async (p: string, cb: () => Promise<void>) => {
      if (listenMap.has(p)) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const unsubscribe = this.firestore.doc(p).onSnapshot(
          async () => {
            if (cb) {
              await cb();
            }
            resolve();
          },
          err => {
            unsubscribe();
            listenMap.delete(p);
            reject(err);
          },
        );
        listenMap.set(p, unsubscribe);
      });
    };

    const release = () => {
      listenMap.forEach(v => {
        v();
      });
      listenMap.clear();
    };

    return { add, release };
  })();

  releaseListeners() {
    this.listeners.release();
  }

  listenAnnounce(id: string, cb: () => Promise<void>) {
    return this.listeners.add(`announces/${id}`, cb);
  }

  async getAnnounce(id: string) {
    const docRef = this.firestore.doc(`announces/${id}`);
    return getCache<Announce>(docRef);
  }

  private async messageToken() {
    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    const token = await this.messaging.getToken({
      vapidKey: this.appEnv.env.vapidKey,
      serviceWorkerRegistration,
    });
    return token;
  }

  async checkNotifyPermission() {
    if (!this.messaging) {
      return 'unsupported';
    }
    try {
      const token = await this.messageToken();
      if (token) {
        return 'allow';
      } else {
        return 'deny';
      }
    } catch (err) {
      if (err.code == 'messaging/permission-blocked') {
        return 'deny';
      }
      throw err;
    }
  }

  async registerMessaging(
    signSecKey: string,
    lang: Lang,
    follows: { [id: string]: { hours?: number[] } },
  ) {
    const fcmToken = await this.messageToken();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const ids = Object.keys(follows);
    ids.sort();

    const signBody = [new Date().toISOString(), fcmToken, ...ids].join('\0');
    const secKey = bs62.decode(signSecKey);
    const sign = bs62.encode(nacl.sign(new TextEncoder().encode(signBody), secKey));
    const signKey = bs62.encode(nacl.sign.keyPair.fromSecretKey(secKey).publicKey);

    const params: RegisterNotificationParams = {
      fcmToken,
      signKey,
      sign,
      lang,
      tz,
      follows,
    };

    await this.callFunc<void>('registerNotification', params);
  }
}
