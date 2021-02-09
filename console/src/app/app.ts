import { Build } from '@stencil/core';
import { Router } from 'stencil-router-v2';
import { AnnounceState, PostState } from './datatypes';
import { AppFirebase } from './firebase';
import { AppMsg } from './msg';
import { AppState } from './state';

const BUILD_INFO = {
  src: '__BUILD_SRC__',
  time: parseInt('__BUILT_TIME__'),
} as const;

export class App {
  readonly buildInfo = BUILD_INFO;

  readonly clientSite: string;

  constructor(
    private appMsg: AppMsg,
    private appFirebase: AppFirebase,
    private appState: AppState,
    private router: Router,
  ) {
    if (Build.isDev) {
      this.clientSite = `http://${location.hostname}:3371`;
    } else {
      this.clientSite = location.origin.replace('console', 'client');
    }
  }

  async init() {
    await this.appFirebase.init();
    this.appState.updateSignIn(this.appFirebase.user != null);
  }

  setTitle(v: string) {
    document.title = v;
  }

  pushRoute(path: string) {
    this.router.push(path);
  }

  get msgs() {
    return this.appMsg.msgs;
  }

  get isSignIn() {
    return this.appState.state.signIn;
  }

  signOut() {
    return this.appFirebase.signOut();
  }

  signInGoogle() {
    return this.appFirebase.signInGoogle();
  }

  createAnnounce(name: string, desc: string) {
    return this.appFirebase.callCreateAnnounce({ name, desc });
  }

  private async listenAnnounces() {
    await this.appFirebase.listenAnnounces(async () => {
      const docs = await this.appFirebase.cachedAnnounces();
      docs.sort((v1, v2) => {
        return v2.uT - v1.uT;
      });

      const as = [] as AnnounceState[];
      for (const doc of docs) {
        const postsData = [] as PostState[];
        if (doc.posts) {
          for (const postID of doc.posts) {
            const post = await this.appFirebase.getPost(doc.id, postID);
            if (post) {
              postsData.push({ ...post, id: postID });
            }
          }
        }

        postsData.sort((v1, v2) => {
          return v2.pT - v1.pT;
        });

        const meta = await this.appFirebase.getAnnounceMeta(doc.id, doc.mid);

        as.push({ ...doc, ...meta, postsData });
      }

      this.appState.updateAnnounces(as);
    });
  }

  getAnnounces() {
    void this.listenAnnounces();
    return this.appState.state.announces;
  }
}
