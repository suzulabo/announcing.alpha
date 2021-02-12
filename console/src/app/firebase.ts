import { Build } from '@stencil/core';
import {
  AnnounceConverter,
  AnnounceMetaConverter,
  AppEnv,
  CreateAnnounceParams,
  DeleteAnnounceParams,
  EditAnnounceParams,
  PostConverter,
} from 'announsing-shared';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import { AppMsg } from './msg';

const ANNOUNCES_LIMIT = 10;

import FieldValue = firebase.firestore.FieldValue;
//import Timestamp = firebase.firestore.Timestamp;

export const converters = {
  announce: new AnnounceConverter<FieldValue>(),
  announceMeta: new AnnounceMetaConverter<FieldValue>(),
  post: new PostConverter<FieldValue>(),
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
  private auth: firebase.auth.Auth;

  constructor(
    private appEnv: AppEnv,
    private appMsg: AppMsg,
    private _firebaseApp?: firebase.app.App,
  ) {}

  private devonly_setEmulator() {
    if (!Build.isDev) {
      return;
    }
    console.log('useEmulator');
    this.functions.useEmulator(location.hostname, 5001);
    this.firestore.settings({ ssl: false, host: `${location.hostname}:8080` });
    this.auth.useEmulator(`http://${location.hostname}:9099`);
  }

  private announcesListener: () => void = null;

  async init() {
    if (this._firebaseApp) {
      return;
    }

    this._firebaseApp = firebase.initializeApp(this.appEnv.env.firebaseConfig);
    this.functions = this._firebaseApp.functions(this.appEnv.env.functionsRegion);
    this.firestore = this._firebaseApp.firestore();
    this.auth = this._firebaseApp.auth();
    this.devonly_setEmulator();

    try {
      await this.firestore.enablePersistence({ synchronizeTabs: true });
    } catch (err) {
      console.warn('enablePersistence', err);
    }

    await new Promise<void>(resolve => {
      this.auth.onAuthStateChanged(() => {
        resolve();
      });
    });
    this.auth.languageCode = this.appMsg.lang;
  }

  get user() {
    return this.auth.currentUser;
  }

  async signInGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    await this.auth.signInWithRedirect(provider);
  }

  async signOut() {
    if (this.announcesListener) {
      this.announcesListener();
      this.announcesListener = null;
    }
    await this.auth.signOut();
  }

  private async callFunc<T>(name: string, params: any): Promise<T> {
    const f = this.functions.httpsCallable(name);
    const res = await f(params);
    return res.data as T;
  }

  async callCreateAnnounce(params: CreateAnnounceParams) {
    return this.callFunc<void>('createAnnounce', params);
  }

  async callEditAnnounce(params: EditAnnounceParams) {
    return this.callFunc<void>('editAnnounce', params);
  }

  async callDeleteAnnounce(params: DeleteAnnounceParams) {
    return this.callFunc<void>('deleteAnnounce', params);
  }

  async cachedAnnounces() {
    const uid = this.user.uid;
    const q = this.firestore
      .collection('announces')
      .withConverter(converters.announce)
      .where(`users.${uid}.own`, '==', true)
      .where(`del`, '==', false);
    const qs = await q.get({ source: 'cache' });
    return qs.docs.map(v => {
      return { id: v.id, ...v.data() };
    });
  }

  listenAnnounces(cb: () => void) {
    if (this.announcesListener) {
      return;
    }

    const uid = this.user.uid;
    const q = this.firestore
      .collection('announces')
      .withConverter(converters.announce)
      .where(`users.${uid}.own`, '==', true)
      .where(`del`, '==', false)
      .limit(ANNOUNCES_LIMIT);
    this.announcesListener = q.onSnapshot(qs => {
      if (qs.metadata.hasPendingWrites) {
        return;
      }
      cb();
    });
  }

  async getAnnounce(id: string) {
    const docRef = this.firestore.doc(`announces/${id}`).withConverter(converters.announce);
    return getCacheFirst(docRef);
  }

  async getAnnounceMeta(id: string, metaID: string) {
    const docRef = this.firestore
      .doc(`announces/${id}/meta/${metaID}`)
      .withConverter(converters.announceMeta);
    return getCacheFirst(docRef);
  }

  async getPost(id: string, postID: string) {
    const docRef = this.firestore
      .doc(`announces/${id}/posts/${postID}`)
      .withConverter(converters.post);
    return getCacheFirst(docRef);
  }
}
