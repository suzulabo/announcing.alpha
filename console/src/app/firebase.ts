import { Build } from '@stencil/core';
import {
  AnnounceHelper,
  AnnounceMetaHelper,
  AppEnv,
  CreateAnnounceParams,
  ImportFeedParams,
  incString,
  PostHelper,
} from 'announsing-shared';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import { AppMsg } from './msg';

const ANNOUNCES_LIMIT = 10;

import FieldValue = firebase.firestore.FieldValue;
import Timestamp = firebase.firestore.Timestamp;

const fsHelper = {
  announce: new AnnounceHelper<FieldValue>(),
  announceMeta: new AnnounceMetaHelper<FieldValue>(),
  post: new PostHelper<FieldValue>(),
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

  async callImportFeed(params: ImportFeedParams) {
    return this.callFunc<void>('importFeed', params);
  }

  async cachedAnnounces() {
    const uid = this.user.uid;
    const q = this.firestore
      .collection('announces')
      .withConverter(fsHelper.announce.converter)
      .where(`users.${uid}.own`, '==', true);
    const qs = await q.get({ source: 'cache' });
    return qs.docs.map(v => {
      return { id: v.id, ...v.data() };
    });
  }

  async listenAnnounces(cb: () => void) {
    if (this.announcesListener) {
      return;
    }

    const cached = await this.cachedAnnounces();
    const lastUpdated = cached.reduce((p, c) => {
      return c.uT > p ? c.uT : p;
    }, 0);

    const uid = this.user.uid;
    const q = this.firestore
      .collection('announces')
      .withConverter(fsHelper.announce.converter)
      .where(`users.${uid}.own`, '==', true)
      .where('uT', '>', Timestamp.fromMillis(lastUpdated))
      .limit(ANNOUNCES_LIMIT);
    this.announcesListener = q.onSnapshot(qs => {
      if (qs.metadata.hasPendingWrites) {
        return;
      }
      cb();
    });
  }

  async updateAnnounce(id: string, name: string, desc: string, link: string, icon: string) {
    const curData = await this.getAnnounce(id);
    if (!curData) {
      return;
    }
    const curMeta = await this.getAnnounceMeta(id, curData.mid);
    if (!curMeta) {
      return;
    }

    const mid = incString.next(curData.mid);

    const batch = this.firestore.batch();
    fsHelper.announce.updateTB(batch, this.firestore.doc(`announces/${id}`), {
      mid,
      uT: FieldValue.serverTimestamp(),
    });
    fsHelper.announceMeta.setTB(batch, this.firestore.doc(`announces/${id}/meta/${mid}`), {
      ...(!!name && { name: name.trim() }),
      ...(!!desc && { desc: desc.trim() }),
      ...(!!link && { link }),
      ...(!!icon && { icon }),
      cT: Timestamp.fromMillis(curMeta.cT),
    });
    batch.delete(this.firestore.doc(`announces/${id}/meta/${curData.mid}`));
    await batch.commit();
  }

  async deleteAnnounce(id: string) {
    await fsHelper.announce.update(this.firestore.doc(`announces/${id}`), {
      del: true,
      uT: FieldValue.serverTimestamp(),
    });
  }

  async putPost(
    id: string,
    postID: string,
    title: string,
    body: string,
    link: string,
    image: string,
  ) {
    await this.firestore.runTransaction<void>(async t => {
      const postRef = postID
        ? this.firestore
            .doc(`announces/${id}/posts/${postID}`)
            .withConverter(fsHelper.post.converter)
        : undefined;
      const docRef = this.firestore
        .doc(`announces/${id}`)
        .withConverter(fsHelper.announce.converter);

      const doc = await t.get(docRef);
      if (!doc.exists) {
        console.warn(`missing announce: ${id}`);
        return;
      }
      const announce = doc.data();
      const posts = announce.posts || [];
      const newID = incString.next(announce.pid);
      const newPostRef = this.firestore
        .doc(`announces/${id}/posts/${newID}`)
        .withConverter(fsHelper.post.converter);

      if (!postRef) {
        // new post
        fsHelper.post.setTB(t, newPostRef, {
          oid: newID,
          title: title,
          body: body,
          link: link,
          img: image,
          pT: FieldValue.serverTimestamp(),
        });

        posts.push(newID);
        fsHelper.announce.updateTB(t, docRef, {
          posts: posts,
          pid: newID,
          uT: FieldValue.serverTimestamp(),
        });
      } else {
        // modify post
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
          console.warn(`missing post: ${id}/${postID}`);
          return;
        }

        const pos = posts.indexOf(postID);
        if (pos < 0) {
          posts.push(newID);
        } else {
          posts[pos] = newID;
        }

        fsHelper.announce.updateTB(t, docRef, {
          posts: posts,
          pid: newID,
          uT: FieldValue.serverTimestamp(),
        });

        const data = postDoc.data();
        fsHelper.post.setTB(t, newPostRef, {
          oid: data.oid,
          title: title,
          body: body,
          link: link,
          img: image,
          pT: Timestamp.fromMillis(data.pT),
        });
        t.delete(postRef);
      }
    });
  }

  async deletePost(id: string, postID: string) {
    const docRef = this.firestore.doc(`announces/${id}`).withConverter(fsHelper.announce.converter);
    const postRef = this.firestore.doc(`announces/${id}/posts/${postID}`);
    const batch = this.firestore.batch();
    fsHelper.announce.updateTB(batch, docRef, {
      posts: firebase.firestore.FieldValue.arrayRemove(postID) as any,
      uT: FieldValue.serverTimestamp(),
    });
    batch.delete(postRef);
    await batch.commit();
  }

  async getAnnounce(id: string) {
    const docRef = this.firestore.doc(`announces/${id}`).withConverter(fsHelper.announce.converter);
    return getCacheFirst(docRef);
  }

  async getAnnounceMeta(id: string, metaID: string) {
    const docRef = this.firestore
      .doc(`announces/${id}/meta/${metaID}`)
      .withConverter(fsHelper.announceMeta.converter);
    return getCacheFirst(docRef);
  }

  async getPost(id: string, postID: string) {
    const docRef = this.firestore
      .doc(`announces/${id}/posts/${postID}`)
      .withConverter(fsHelper.post.converter);
    return getCacheFirst(docRef);
  }
}
