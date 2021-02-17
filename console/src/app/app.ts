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

  set loading(v: boolean) {
    this.appState.updateLoading(v);
  }
  get loading() {
    return this.appState.state.loading;
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

  editAnnounce(
    id: string,
    name: string,
    desc: string,
    link: string,
    icon: string,
    newIcon: string,
  ) {
    return this.appFirebase.callEditAnnounce({ id, name, desc, link, icon, newIcon });
  }

  deleteAnnounce(id: string) {
    return this.appFirebase.callDeleteAnnounce({ id });
  }

  private async toAnnounceState(id: string, a: Announce): Promise<AnnounceState> {
    const meta = await this.appFirebase.getAnnounceMeta(id, a.mid);
    if (!meta) {
      return;
    }

    const postsData = [] as PostState[];
    if (a.posts) {
      for (const postID of a.posts) {
        const post = await this.appFirebase.getPost(id, postID);
        if (post) {
          postsData.push({ ...post, id: postID });
        }
      }
    }

    postsData.sort((v1, v2) => {
      return v2.pT - v1.pT;
    });

    return { id, ...a, ...meta, postsData };
  }

  private listenUser() {
    this.appFirebase.listenUser(async () => {
      const user = await this.appFirebase.getUser();
      if (!user || !user.announces) {
        return;
      }

      const as = [] as AnnounceState[];
      for (const id of user.announces) {
        const announce = await this.appFirebase.getAnnounce(id);
        const v = await this.toAnnounceState(id, announce);
        if (v) {
          as.push(v);
        }
      }

      as.sort((v1, v2) => {
        return v2.uT - v1.uT;
      });

      this.appState.updateAnnounces(as);
    });
  }

  getAnnounces() {
    this.listenUser();
    return this.appState.state.announces;
  }

  async getAnnounceState(id: string) {
    const a = await this.appFirebase.getAnnounce(id);
    if (a) {
      return await this.toAnnounceState(id, a);
    }
  }
}
