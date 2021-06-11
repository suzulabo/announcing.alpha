import { Build } from '@stencil/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import {
  Announce,
  AnnounceMeta,
  AppEnv,
  CreateAnnounceParams,
  DataResult,
  DeleteAnnounceParams,
  DeletePostParams,
  EditAnnounceParams,
  Image,
  NOT_FOUND,
  Post,
  PutPostParams,
  User,
} from 'src/shared';
import { AppMsg } from './msg';
import { AppState } from './state';

const getCache = async <T>(
  docRef: firebase.firestore.DocumentReference,
): Promise<DataResult<T> | undefined> => {
  {
    try {
      const doc = await docRef.get({ source: 'cache' });
      if (doc.exists) {
        return { state: 'SUCCESS', value: doc.data() as T };
      }
    } catch (err) {
      if (err.code == 'unavailable') {
        return;
      }
      throw err;
    }
  }
  return;
};

const getCacheFirst = async <T>(
  docRef: firebase.firestore.DocumentReference,
): Promise<DataResult<T>> => {
  {
    const r = await getCache<T>(docRef);
    if (r) {
      return r;
    }
  }
  {
    const doc = await docRef.get({ source: 'default' });
    if (doc.exists) {
      return { state: 'SUCCESS', value: doc.data() as T };
    }
  }
  return NOT_FOUND;
};

export class AppFirebase {
  private functions!: firebase.functions.Functions;
  private firestore!: firebase.firestore.Firestore;
  private auth!: firebase.auth.Auth;

  constructor(
    private appEnv: AppEnv,
    private appState: AppState,
    private appMsg: AppMsg,
    private _firebaseApp?: firebase.app.App,
  ) {}

  private devonly_setEmulator() {
    if (!Build.isDev) {
      return;
    }
    console.log('useEmulator');
    this.functions.useEmulator(location.hostname, parseInt(location.port));
    this.firestore.settings({ ssl: location.protocol == 'https:', host: `${location.host}` });
    this.auth.useEmulator(location.origin);
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
      this.auth.onAuthStateChanged(user => {
        this.appState.signIn.set(user != null);
        resolve();
      });
    });
    this.auth.languageCode = this.appMsg.lang;
  }

  get user() {
    return this.auth.currentUser;
  }

  async signInGoogle(keep: boolean) {
    await this.auth.setPersistence(keep ? 'local' : 'session');

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    await this.auth.signInWithRedirect(provider);
  }

  async signInTwitter(keep: boolean) {
    await this.auth.setPersistence(keep ? 'local' : 'session');

    const provider = new firebase.auth.TwitterAuthProvider();
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
    const notFounds = new Set<string>();
    const listenMap = new Map<string, () => void>();

    const add = (p: string, cb: () => void) => {
      if (listenMap.has(p)) {
        return;
      }
      if (notFounds.has(p)) {
        return;
      }

      const unsubscribe = this.firestore.doc(p).onSnapshot({
        next: ds => {
          if (!ds.exists) {
            notFounds.add(p);
            unsubscribe();
            listenMap.delete(p);
          }
          if (cb) {
            cb();
          }
        },
        error: err => {
          console.error('onSnapshot error', p, err);
          unsubscribe();
          listenMap.delete(p);
        },
      });
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

    const docRef = this.firestore.doc(`users/${this.user.uid}`);
    return getCache<User>(docRef);
  }

  async getAnnounce(id: string) {
    const docRef = this.firestore.doc(`announces/${id}`);
    return getCache<Announce>(docRef);
  }

  async getAnnounceMeta(id: string, metaID: string) {
    const docRef = this.firestore.doc(`announces/${id}/meta/${metaID}`);
    return getCacheFirst<AnnounceMeta>(docRef);
  }

  async getPost(id: string, postID: string) {
    const docRef = this.firestore.doc(`announces/${id}/posts/${postID}`);
    return getCacheFirst<Post>(docRef);
  }

  async getImage(id: string) {
    const docRef = this.firestore.doc(`images/${id}`);
    return getCacheFirst<Image>(docRef);
  }
}
