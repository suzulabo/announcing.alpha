import { Build } from '@stencil/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import {
  AnnounceConverter,
  AnnounceMetaConverter,
  AppEnv,
  CreateAnnounceParams,
  DeleteAnnounceParams,
  DeletePostParams,
  EditAnnounceParams,
  PostConverter,
  PutPostParams,
  UserConverter,
} from 'src/shared';
import { AppMsg } from './msg';

export const converters = {
  announce: new AnnounceConverter(),
  announceMeta: new AnnounceMetaConverter(),
  post: new PostConverter(),
  user: new UserConverter(),
};

const getCacheFirst = async <T>(
  docRef: firebase.firestore.DocumentReference<T>,
  cacheOnly = false,
) => {
  {
    try {
      const doc = await docRef.get({ source: 'cache' });
      if (doc.exists) {
        console.debug('hit cache:', docRef.path);
        return doc.data();
      }
    } catch {}
  }
  if (cacheOnly) {
    return;
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

  async callPutPost(params: PutPostParams) {
    return this.callFunc<void>('putPost', params);
  }

  async callDeletePost(params: DeletePostParams) {
    return this.callFunc<void>('deletePost', params);
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

  listenUser(cb: () => Promise<void>) {
    if (!this.user) {
      return;
    }
    return this.listeners.add(`users/${this.user.uid}`, cb);
  }

  listenAnnounce(id: string, cb: () => Promise<void>) {
    return this.listeners.add(`announces/${id}`, cb);
  }

  async getUser() {
    if (!this.user) {
      return;
    }

    const docRef = this.firestore.doc(`users/${this.user.uid}`).withConverter(converters.user);
    return getCacheFirst(docRef, true);
  }

  async getAnnounce(id: string) {
    const docRef = this.firestore.doc(`announces/${id}`).withConverter(converters.announce);
    return getCacheFirst(docRef, true);
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

  async getImage(id: string) {
    const docRef = this.firestore.doc(`images/${id}`);
    const doc = await getCacheFirst(docRef);
    const data = doc.d as firebase.firestore.Blob;
    return `data:image/jpeg;base64,${data.toBase64()}`;
  }
}
