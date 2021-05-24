import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Build } from '@stencil/core';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/messaging';
import { Announce, AppEnv, Lang, RegisterNotificationParams } from 'src/shared';
import nacl from 'tweetnacl';
import { DataResult, NOT_FOUND, PostNotificationRecievedEvent } from './datatypes';
import { bs62 } from './utils';

class CapNotification {
  private token?: string;

  constructor() {
    void PushNotifications.addListener('pushNotificationReceived', notification => {
      console.debug('pushNotificationReceived', JSON.stringify(notification, null, 2));

      this.dispatchNotifyPost(notification.data);
    });
    void PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.debug('pushNotificationActionPerformed', JSON.stringify(notification, null, 2));

      this.dispatchNotifyPost(notification.notification.data);
    });
  }

  private dispatchNotifyPost(data?: any) {
    const announceID = data?.announceID;
    if (!announceID || typeof announceID != 'string') {
      return;
    }
    const postID = data?.postID;
    if (!postID || typeof postID != 'string') {
      return;
    }

    const event = new PostNotificationRecievedEvent({ announceID, postID });
    dispatchEvent(event);
  }

  async checkNotifyPermission(ask: boolean) {
    {
      const result = await PushNotifications.checkPermissions();

      switch (result.receive) {
        case 'denied':
        case 'granted':
          return result.receive;
        default:
          if (!ask) {
            return 'default';
          }
      }
    }

    {
      const result = await PushNotifications.requestPermissions();
      switch (result.receive) {
        case 'denied':
        case 'granted':
          return result.receive;
        default:
          return 'default';
      }
    }
  }

  async messageToken() {
    if (this.token) {
      return this.token;
    }

    const p = (() => {
      let resolve!: (v: string) => void;
      let reject!: (r: any) => void;
      const promise = new Promise<string>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      return { promise, resolve, reject };
    })();

    const handlers = [
      await PushNotifications.addListener('registration', v => {
        p.resolve(v.value);
      }),
      await PushNotifications.addListener('registrationError', reason => {
        p.reject(reason);
      }),
    ];

    try {
      await PushNotifications.register();
      this.token = await p.promise;
      return this.token;
    } finally {
      handlers.forEach(v => v.remove());
    }
  }
}

const getCache = async <T>(
  docRef: firebase.firestore.DocumentReference,
): Promise<DataResult<T> | undefined> => {
  const doc = await docRef.get({ source: 'cache' });
  if (doc.exists) {
    return { state: 'SUCCESS', value: doc.data() as T };
  }
  return;
};

export class AppFirebase {
  private functions: firebase.functions.Functions;
  private firestore: firebase.firestore.Firestore;

  private messaging?: firebase.messaging.Messaging;
  private capNotification?: CapNotification;

  constructor(private appEnv: AppEnv, _firebaseApp?: firebase.app.App) {
    if (!_firebaseApp) {
      _firebaseApp = firebase.initializeApp(this.appEnv.env.firebaseConfig);
    }
    this.functions = _firebaseApp.functions(this.appEnv.env.functionsRegion);
    this.firestore = _firebaseApp.firestore();

    if (Capacitor.getPlatform() != 'web') {
      this.capNotification = new CapNotification();
    }

    if (!this.capNotification) {
      try {
        this.messaging = _firebaseApp.messaging();
      } catch (err) {
        console.warn('create messaging', err);
      }
    }
    this.devonly_setEmulator();
  }

  private devonly_setEmulator() {
    if (!Build.isDev) {
      return;
    }
    console.log('useEmulator');
    this.functions.useEmulator(location.hostname, parseInt(location.port));
    this.firestore.settings({ ssl: location.protocol == 'https:', host: `${location.host}` });
  }

  async init() {
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
    const notFounds = new Set<string>();
    const listenMap = new Map<string, () => void>();

    const add = (p: string, cb: () => void) => {
      if (listenMap.has(p)) {
        return;
      }
      if (notFounds.has(p)) {
        return;
      }

      const unsubscribe = this.firestore.doc(p).onSnapshot(
        ds => {
          if (!ds.exists) {
            notFounds.add(p);
            unsubscribe();
            listenMap.delete(p);
          }
          if (cb) {
            cb();
          }
        },
        err => {
          console.error('onSnapshot error', p, err);
          unsubscribe();
          listenMap.delete(p);
        },
      );
      listenMap.set(p, unsubscribe);
    };

    const release = () => {
      listenMap.forEach(v => {
        v();
      });
      listenMap.clear();
    };

    return { add, release, notFounds } as const;
  })();

  releaseListeners() {
    this.listeners.release();
  }

  listenAnnounce(id: string, cb: () => Promise<void>) {
    return this.listeners.add(`announces/${id}`, cb);
  }

  getAnnounce(id: string): Promise<DataResult<Announce> | undefined> {
    const p = `announces/${id}`;
    if (this.listeners.notFounds.has(p)) {
      return Promise.resolve(NOT_FOUND);
    }
    const docRef = this.firestore.doc(p);
    return getCache<Announce>(docRef);
  }

  private async messageToken() {
    if (this.capNotification) {
      return this.capNotification.messageToken();
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    const token = await this.messaging?.getToken({
      vapidKey: this.appEnv.env.vapidKey,
      serviceWorkerRegistration,
    });
    return token;
  }

  async checkNotifyPermission(ask: boolean) {
    if (this.capNotification) {
      return this.capNotification.checkNotifyPermission(ask);
    }

    if (!this.messaging) {
      return 'unsupported';
    }

    if (Notification == null || Notification.permission == null) {
      return 'unsupported';
    }

    const permission = Notification.permission;
    switch (permission) {
      case 'granted':
      case 'denied':
        return permission;
      case 'default':
        if (!ask) {
          return permission;
        }
    }

    try {
      const token = await this.messageToken();
      if (token) {
        return 'granted';
      } else {
        return 'denied';
      }
    } catch (err) {
      if (err.code == 'messaging/permission-blocked') {
        return 'denied';
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
    if (!fcmToken) {
      throw new Error("can't get fcmToken");
    }
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
