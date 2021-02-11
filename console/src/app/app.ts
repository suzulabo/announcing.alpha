import { Build } from '@stencil/core';
import { Announce } from 'announsing-shared';
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

  editAnnounce(id: string, name: string, desc: string, link: string) {
    return this.appFirebase.callEditAnnounce({ id, name, desc, link });
  }

  private async toAnnounceState(a: Announce) {
    const meta = await this.appFirebase.getAnnounceMeta(a.id, a.mid);
    if (!meta) {
      return;
    }

    const postsData = [] as PostState[];
    if (a.posts) {
      for (const postID of a.posts) {
        const post = await this.appFirebase.getPost(a.id, postID);
        if (post) {
          postsData.push({ ...post, id: postID });
        }
      }
    }

    postsData.sort((v1, v2) => {
      return v2.pT - v1.pT;
    });

    return { ...a, ...meta, postsData } as AnnounceState;
  }

  private async listenAnnounces() {
    await this.appFirebase.listenAnnounces(async () => {
      const docs = await this.appFirebase.cachedAnnounces();
      docs.sort((v1, v2) => {
        return v2.uT - v1.uT;
      });

      const as = [] as AnnounceState[];
      for (const doc of docs) {
        const v = await this.toAnnounceState(doc);
        if (v) {
          as.push(v);
        }
      }

      this.appState.updateAnnounces(as);
    });
  }

  getAnnounces() {
    void this.listenAnnounces();
    return this.appState.state.announces;
  }

  async getAnnounceState(id: string) {
    const a = await this.appFirebase.getAnnounce(id);
    if (a) {
      return await this.toAnnounceState(a);
    }
  }
}
