import { Build } from '@stencil/core';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/messaging';
import { AnnounceConverter, AppEnv, RegisterNotificationParams } from 'src/shared';

import FieldValue = firebase.firestore.FieldValue;

export const converters = {
  announce: new AnnounceConverter<FieldValue>(),
};

const getCache = async <T>(docRef: firebase.firestore.DocumentReference<T>) => {
  {
    try {
      const doc = await docRef.get({ source: 'cache' });
      if (doc.exists) {
        console.debug('hit cache:', docRef.path);
        return doc.data();
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
    this.functions.useEmulator(location.hostname, 5001);
    this.firestore.settings({ ssl: false, host: `${location.hostname}:8080` });
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
    const docRef = this.firestore.doc(`announces/${id}`).withConverter(converters.announce);
    return getCache(docRef);
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

  async registerMessaging(announceID: string, enable: boolean, hours?: number[]) {
    const fcmToken = await this.messageToken();
    const params: RegisterNotificationParams = {
      fcmToken,
      announceID,
      enable,
      hours,
    };
    await this.callFunc<void>('registerNotification', params);
  }
}
