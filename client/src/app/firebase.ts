import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Build } from '@stencil/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  doc,
  DocumentData,
  DocumentReference,
  enableMultiTabIndexedDbPersistence,
  FirebaseFirestore,
  getDocFromCache,
  getFirestore,
  onSnapshot,
  useFirestoreEmulator,
} from 'firebase/firestore';
import { Functions, getFunctions, httpsCallable, useFunctionsEmulator } from 'firebase/functions';
import { FirebaseMessaging, getMessaging, getToken } from 'firebase/messaging';
import { Announce, AppEnv, Lang, RegisterNotificationParams } from 'src/shared';
import nacl from 'tweetnacl';
import { PostNotificationRecievedEvent } from './datatypes';
import { bs62 } from './utils';

class CapNotification {
  private token?: string;

  constructor() {
    void PushNotifications.addListener('pushNotificationReceived', notification => {
      console.debug('pushNotificationReceived', JSON.stringify(notification, null, 2));

      void LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: notification.title || '',
            body: notification.body || '',
            extra: notification.data,
          },
        ],
      });
    });
    void PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.debug('pushNotificationActionPerformed', JSON.stringify(notification, null, 2));

      this.dispatchPostNotificationRecieved(notification.notification.data);
    });
    void LocalNotifications.addListener('localNotificationActionPerformed', notification => {
      console.debug('localNotificationActionPerformed', JSON.stringify(notification, null, 2));

      this.dispatchPostNotificationRecieved(notification.notification.extra);
    });
  }

  private dispatchPostNotificationRecieved(data?: any) {
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

export class FirestoreUpdatedEvent extends CustomEvent<{
  collection: string;
  id: string;
  value?: DocumentData;
}> {
  constructor(detail: { collection: string; id: string; value?: DocumentData }) {
    super('FirestoreUpdated', { detail });
  }
}

class FirestoreHelper {
  private docMap = new Map<
    string,
    {
      unsubscribe?: () => void;
      listener?: Promise<{ data?: DocumentData }>;
      temporary?: boolean;
    }
  >();

  constructor(private firestore: FirebaseFirestore) {}

  async listenAndGet<T>(p: string, temporary?: boolean): Promise<T | undefined> {
    const docInfo = this.docMap.get(p) || {};
    const docRef = doc(this.firestore, p);

    if (!docInfo.listener) {
      docInfo.temporary = temporary;
      docInfo.listener = new Promise((resolve, reject) => {
        const value: { data?: DocumentData } = {};

        docInfo.unsubscribe = onSnapshot(docRef, {
          next: ds => {
            value.data = ds.data();
            resolve(value);

            window.dispatchEvent(
              new FirestoreUpdatedEvent({
                collection: docRef.parent.id,
                id: docRef.id,
                value: ds.data(),
              }),
            );
          },
          error: reason => {
            if (docInfo.unsubscribe) {
              docInfo.unsubscribe();
            }
            this.docMap.delete(p);
            reject(reason);
          },
        });
      });

      this.docMap.set(p, docInfo);
    }

    {
      const v = await getCache<T>(docRef);
      if (v) {
        return v;
      }
    }

    const v = await docInfo.listener;
    return v.data as T;
  }
}

const getCache = async <T>(docRef: DocumentReference): Promise<T | undefined> => {
  try {
    const doc = await getDocFromCache(docRef);
    if (doc.exists()) {
      return doc.data() as T;
    }
  } catch (err) {
    if (err.code == 'unavailable') {
      return;
    }
    throw err;
  }
  return;
};

export class AppFirebase {
  private functions: Functions;
  private firestore: FirebaseFirestore;
  private firestoreHelper: FirestoreHelper;

  private messaging?: FirebaseMessaging;
  private capNotification?: CapNotification;

  constructor(private appEnv: AppEnv, _firebaseApp?: FirebaseApp) {
    if (!_firebaseApp) {
      _firebaseApp = initializeApp(this.appEnv.env.firebaseConfig);
    }

    this.functions = getFunctions(_firebaseApp, this.appEnv.env.functionsRegion);
    this.firestore = getFirestore(_firebaseApp);
    this.firestoreHelper = new FirestoreHelper(this.firestore);

    if (Capacitor.getPlatform() != 'web') {
      this.capNotification = new CapNotification();
    }

    if (!this.capNotification) {
      try {
        this.messaging = getMessaging(_firebaseApp);
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

    useFunctionsEmulator(this.functions, location.hostname, parseInt(location.port));
    useFirestoreEmulator(this.firestore, location.hostname, parseInt(location.port));
  }

  async init() {
    try {
      await enableMultiTabIndexedDbPersistence(this.firestore);
    } catch (err) {
      console.warn('enablePersistence', err);
    }
  }

  private async callFunc<RequestData = unknown, ResponseData = unknown>(
    name: string,
    params: RequestData,
  ): Promise<ResponseData> {
    const f = httpsCallable<RequestData, ResponseData>(this.functions, name);
    const res = await f(params);
    return res.data;
  }

  async getAnnounce(id: string, temporary?: boolean) {
    return this.firestoreHelper.listenAndGet<Announce>(`announces/${id}`, temporary);
  }

  private async messageToken() {
    if (this.capNotification) {
      return this.capNotification.messageToken();
    }

    if (!this.messaging) {
      return;
    }

    const swReg = await navigator.serviceWorker.getRegistration();
    const token = await getToken(this.messaging, {
      vapidKey: this.appEnv.env.vapidKey,
      swReg,
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

  async registerMessaging(signSecKey: string, lang: Lang, announces: string[]) {
    const token = await this.messageToken();
    if (!token) {
      throw new Error("can't get token");
    }

    const signBody = [new Date().toISOString(), token, ...announces].join('\0');
    const secKey = bs62.decode(signSecKey);
    const sign = bs62.encode(nacl.sign(new TextEncoder().encode(signBody), secKey));
    const signKey = bs62.encode(nacl.sign.keyPair.fromSecretKey(secKey).publicKey);

    const params: RegisterNotificationParams = {
      token,
      signKey,
      sign,
      lang,
      announces,
    };

    await this.callFunc<RegisterNotificationParams, void>('registerNotification', params);
  }
}
