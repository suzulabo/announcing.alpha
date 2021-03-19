import { Build } from '@stencil/core';
import {
  AnnounceConverter,
  AppEnv,
  NotificationMode,
  RegisterNotificationParams,
} from 'announsing-shared';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/messaging';

import FieldValue = firebase.firestore.FieldValue;

export const converters = {
  announce: new AnnounceConverter<FieldValue>(),
};

const getCacheFirst = async <T>(docRef: firebase.firestore.DocumentReference<T>) => {
  {
    try {
      const doc = await docRef.get({ source: 'cache' });
      if (doc.exists) {
        console.debug('hit cache:', docRef.path);
        return doc.data();
      }
    } catch {}
  }
  {
    const doc = await docRef.get({ source: 'default' });
    if (doc.exists) {
      return doc.data();
    }
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
    this.messaging = this._firebaseApp.messaging();
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
    const l = new Set<string>();

    const add = (p: string, cb?: () => void) => {
      if (l.has(p)) {
        return;
      }

      return new Promise<void>((resovle, reject) => {
        const unsubscribe = this.firestore.doc(p).onSnapshot(
          () => {
            resovle();
            if (cb) {
              cb();
            }
          },
          err => {
            console.warn(err);
            unsubscribe();
            l.delete(p);
            reject();
          },
        );
        l.add(p);
      });
    };

    return { add };
  })();

  async getAnnounce(id: string) {
    const p = `announces/${id}`;
    await this.listeners.add(p);
    const docRef = this.firestore.doc(p).withConverter(converters.announce);
    return getCacheFirst(docRef);
  }

  private async messageToken() {
    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    const token = await this.messaging.getToken({
      vapidKey: this.appEnv.env.vapidKey,
      serviceWorkerRegistration,
    });
    return token;
  }

  async registerMessaging(announceID: string, mode: NotificationMode, hours?: number[]) {
    const fcmToken = await this.messageToken();
    const params: RegisterNotificationParams = {
      fcmToken,
      announceID,
      mode,
      hours,
    };
    console.log(params);
    await this.callFunc<void>('registerNotification', params);
  }
}
