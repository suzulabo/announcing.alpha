import { Build } from '@stencil/core';
import { AnnounceConverter, AppEnv } from 'announsing-shared';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';

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
    this.devonly_setEmulator();

    try {
      await this.firestore.enablePersistence({ synchronizeTabs: true });
    } catch (err) {
      console.warn('enablePersistence', err);
    }
  }
  async getAnnounce(id: string) {
    const docRef = this.firestore.doc(`announces/${id}`).withConverter(converters.announce);
    return getCacheFirst(docRef);
  }
}
