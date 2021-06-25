import { Build } from '@stencil/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  TwitterAuthProvider,
  useAuthEmulator,
} from 'firebase/auth';
import {
  enableMultiTabIndexedDbPersistence,
  FirebaseFirestore,
  getFirestore,
  useFirestoreEmulator,
} from 'firebase/firestore';
import { Functions, getFunctions, httpsCallable, useFunctionsEmulator } from 'firebase/functions';
import {
  Announce,
  AnnounceMeta,
  AppEnv,
  CreateAnnounceParams,
  DeleteAnnounceParams,
  DeletePostParams,
  EditAnnounceParams,
  Image,
  Post,
  PutPostParams,
  User,
} from 'src/shared';
import { FirestoreHelper } from 'src/shared-ui/utils/firestore';
import { AppMsg } from './msg';
import { AppState } from './state';

export class AppFirebase {
  private functions: Functions;
  private firestore: FirebaseFirestore;
  private auth: Auth;
  private firestoreHelper: FirestoreHelper;

  constructor(
    private appEnv: AppEnv,
    private appState: AppState,
    private appMsg: AppMsg,
    firebaseApp?: FirebaseApp,
  ) {
    if (!firebaseApp) {
      firebaseApp = initializeApp(this.appEnv.env.firebaseConfig);
    }

    this.functions = getFunctions(firebaseApp, this.appEnv.env.functionsRegion);
    this.firestore = getFirestore(firebaseApp);
    this.auth = getAuth(firebaseApp);
    this.firestoreHelper = new FirestoreHelper(this.firestore);

    this.devonly_setEmulator();
  }

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

  async signIn(keep: boolean, kind: 'google' | 'twitter') {
    // TODO: not work v9 beta
    if (keep) {
      //await setPersistence(this.auth, { type: 'LOCAL' });
    } else {
      //await setPersistence(this.auth, { type: 'SESSION' });
    }

    switch (kind) {
      case 'google': {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account',
        });

        await signInWithRedirect(this.auth, provider);
        return;
      }
      case 'twitter': {
        const provider = new TwitterAuthProvider();
        await signInWithRedirect(this.auth, provider);
      }
    }
  }

  async signOut() {
    this.firestoreHelper.releaseListener();
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

  async getUser() {
    if (!this.user) {
      return;
    }

    return this.firestoreHelper.listenAndGet<User>(`users/${this.user.uid}`, (oldData, newData) => {
      return oldData.uT.toMillis() != newData.uT.toMillis();
    });
  }

  async getAnnounce(id: string) {
    return this.firestoreHelper.listenAndGet<Announce>(`announces/${id}`, (oldData, newData) => {
      return oldData.uT.toMillis() != newData.uT.toMillis();
    });
  }

  async getAnnounceMeta(id: string, metaID: string) {
    return this.firestoreHelper.getCacheFirst<AnnounceMeta>(`announces/${id}/meta/${metaID}`);
  }

  async getPost(id: string, postID: string) {
    return this.firestoreHelper.getCacheFirst<Post>(`announces/${id}/posts/${postID}`);
  }

  async getImage(id: string) {
    return this.firestoreHelper.getCacheFirst<Image>(`images/${id}`);
  }
}
