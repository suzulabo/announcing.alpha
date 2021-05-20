import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Build } from '@stencil/core';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/messaging';
import { Announce, AppEnv, Lang, RegisterNotificationParams } from 'src/shared';
import nacl from 'tweetnacl';
import { NotifyAnnounceEvent } from './datatypes';
import { bs62 } from './utils';

class CapNotification {
  private token: string;

  constructor() {
    void PushNotifications.addListener('pushNotificationReceived', notification => {
      console.debug('pushNotificationReceived', JSON.stringify(notification, null, 2));

      const announceID = notification.data?.announceID;
      if (!announceID || typeof announceID != 'string') {
        return;
      }

      this.dispatchNotifyAnnounce(announceID);
    });
    void PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.debug('pushNotificationActionPerformed', JSON.stringify(notification, null, 2));

      const announceID = notification.notification.data?.announceID;
      if (!announceID || typeof announceID != 'string') {
        return;
      }

      this.dispatchNotifyAnnounce(announceID);
    });
  }

  private dispatchNotifyAnnounce(announceID: string) {
    const event = new NotifyAnnounceEvent('notifyAnnounce', {
      detail: { announceID },
    });
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

    const handlers = [] as PluginListenerHandle[];
    try {
      this.token = await new Promise<string>(async (resolve, reject) => {
        handlers.push(
          await PushNotifications.addListener('registration', token => {
            resolve(token.value);
          }),
          await PushNotifications.addListener('registrationError', reason => {
            reject(reason);
          }),
        );

        PushNotifications.register().catch(reason => {
          reject(reason);
        });
      });
      return this.token;
    } finally {
      handlers.forEach(v => v.remove());
    }
  }
}

const getCache = async <T>(docRef: firebase.firestore.DocumentReference): Promise<T> => {
  {
    try {
      const doc = await docRef.get({ source: 'cache' });
      if (doc.exists) {
        return doc.data() as T;
      }
    } catch {}
  }
};

export class AppFirebase {
  private functions: firebase.functions.Functions;
  private firestore: firebase.firestore.Firestore;

  private messaging?: firebase.messaging.Messaging;
  private capNotification?: CapNotification;

  constructor(private appEnv: AppEnv, private _firebaseApp?: firebase.app.App) {
    if (Capacitor.getPlatform() != 'web') {
      this.capNotification = new CapNotification();
    }
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
    if (this._firebaseApp) {
      return;
    }

    this._firebaseApp = firebase.initializeApp(this.appEnv.env.firebaseConfig);
    this.functions = this._firebaseApp.functions(this.appEnv.env.functionsRegion);
    this.firestore = this._firebaseApp.firestore();

    if (!this.capNotification) {
      try {
        this.messaging = this._firebaseApp.messaging();
      } catch (err) {
        console.warn('create messaging', err);
      }
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
    if (this.capNotification) {
      return this.capNotification.messageToken();
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    const token = await this.messaging.getToken({
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
