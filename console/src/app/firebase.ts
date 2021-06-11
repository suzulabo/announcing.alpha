import { Build } from '@stencil/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithRedirect,
  TwitterAuthProvider,
  useAuthEmulator,
} from 'firebase/auth';
import {
  doc,
  DocumentReference,
  enableMultiTabIndexedDbPersistence,
  FirebaseFirestore,
  getDocFromCache,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  useFirestoreEmulator,
} from 'firebase/firestore';
import { Functions, getFunctions, httpsCallable, useFunctionsEmulator } from 'firebase/functions';
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

const getCache = async <T>(docRef: DocumentReference): Promise<DataResult<T> | undefined> => {
  {
    try {
      const doc = await getDocFromCache(docRef);
      if (doc.exists()) {
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

const getCacheFirst = async <T>(docRef: DocumentReference): Promise<DataResult<T>> => {
  {
    const r = await getCache<T>(docRef);
    if (r) {
      return r;
    }
  }
  {
    const doc = await getDocFromServer(docRef);
    if (doc.exists()) {
      return { state: 'SUCCESS', value: doc.data() as T };
    }
  }
  return NOT_FOUND;
};

export class AppFirebase {
  private functions!: Functions;
  private firestore!: FirebaseFirestore;
  private auth!: Auth;

  constructor(
    private appEnv: AppEnv,
    private appState: AppState,
    private appMsg: AppMsg,
    private _firebaseApp?: FirebaseApp,
  ) {}

  private devonly_setEmulator() {
    if (!Build.isDev) {
      return;
    }
    console.log('useEmulator');
    useFunctionsEmulator(this.functions, location.hostname, parseInt(location.port));
    useFirestoreEmulator(this.firestore, location.hostname, parseInt(location.port));
    useAuthEmulator(this.auth, location.origin, { disableWarnings: true });
  }

  async init() {
    if (this._firebaseApp) {
      return;
    }

    this._firebaseApp = initializeApp(this.appEnv.env.firebaseConfig);
    this.functions = getFunctions(this._firebaseApp, this.appEnv.env.functionsRegion);
    this.firestore = getFirestore(this._firebaseApp);
    this.auth = getAuth(this._firebaseApp);
    this.devonly_setEmulator();

    try {
      await enableMultiTabIndexedDbPersistence(this.firestore);
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
    if (keep) {
      await setPersistence(this.auth, { type: 'LOCAL' });
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    await signInWithRedirect(this.auth, provider);
  }

  async signInTwitter(keep: boolean) {
    if (keep) {
      await setPersistence(this.auth, { type: 'LOCAL' });
    }

    const provider = new TwitterAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    await signInWithRedirect(this.auth, provider);
  }

  async signOut() {
    await this.auth.signOut();
  }

  private async callFunc<RequestData = unknown, ResponseData = unknown>(
    name: string,
    params: RequestData,
  ): Promise<ResponseData> {
    const f = httpsCallable<RequestData, ResponseData>(this.functions, name);
    const res = await f(params);
    return res.data;
  }

  async callCreateAnnounce(params: CreateAnnounceParams) {
    return this.callFunc<CreateAnnounceParams, void>('createAnnounce', params);
  }

  async callEditAnnounce(params: EditAnnounceParams) {
    return this.callFunc<EditAnnounceParams, void>('editAnnounce', params);
  }

  async callDeleteAnnounce(params: DeleteAnnounceParams) {
    return this.callFunc<DeleteAnnounceParams, void>('deleteAnnounce', params);
  }

  async callPutPost(params: PutPostParams) {
    return this.callFunc<PutPostParams, void>('putPost', params);
  }

  async callDeletePost(params: DeletePostParams) {
    return this.callFunc<DeletePostParams, void>('deletePost', params);
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

      const unsubscribe = onSnapshot(doc(this.firestore, p), {
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

    const docRef = doc(this.firestore, `users/${this.user.uid}`);
    return getCache<User>(docRef);
  }

  async getAnnounce(id: string) {
    const docRef = doc(this.firestore, `announces/${id}`);
    return getCache<Announce>(docRef);
  }

  async getAnnounceMeta(id: string, metaID: string) {
    const docRef = doc(this.firestore, `announces/${id}/meta/${metaID}`);
    return getCacheFirst<AnnounceMeta>(docRef);
  }

  async getPost(id: string, postID: string) {
    const docRef = doc(this.firestore, `announces/${id}/posts/${postID}`);
    return getCacheFirst<Post>(docRef);
  }

  async getImage(id: string) {
    const docRef = doc(this.firestore, `images/${id}`);
    return getCacheFirst<Image>(docRef);
  }
}
