import { Build } from '@stencil/core';
import { Announce } from 'src/shared';
import { AnnounceState } from './datatypes';
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
  ) {
    if (Build.isDev) {
      this.clientSite = `http://${location.hostname}:3371`;
    } else {
      this.clientSite = location.origin.replace('console', 'client');
    }
  }

  async init() {
    await this.appFirebase.init();
    this.appState.state.signIn = this.appFirebase.user != null;
  }

  setTitle(v: string) {
    document.title = v;
  }

  storeBeforeRoute(p: string) {
    const state = history.state || {};
    history.replaceState({ ...state, beforeRoute: p }, null);
  }

  href(p: string, back?: boolean) {
    return {
      href: p,
      onClick: (ev: MouseEvent) => {
        // https://github.com/ionic-team/stencil-router-v2/blob/master/src/router.ts
        if (!ev.metaKey && !ev.ctrlKey && ev.which != 2 && ev.button != 1) {
          ev.preventDefault();
          this.pushRoute(p, back);
        }
      },
    };
  }

  redirectRoute(path: string) {
    history.replaceState(history.state, null, path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  pushRoute(path: string, back?: boolean) {
    if (back && history.state?.beforeRoute == path) {
      history.back();
    } else {
      history.pushState(null, null, path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  set loading(v: boolean) {
    this.appState.state.loading = v;
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

  async signOut() {
    this.appFirebase.releaseListeners();
    await this.appFirebase.signOut();
    this.appState.state.signIn = this.appFirebase.user != null;
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

  putPost(id: string, title: string, body: string, link: string, imgData: string, editID: string) {
    return this.appFirebase.callPutPost({ id, title, body, link, imgData, editID });
  }

  deleteAnnounce(id: string) {
    return this.appFirebase.callDeleteAnnounce({ id });
  }

  deletePost(id: string, postID: string) {
    return this.appFirebase.callDeletePost({ id, postID });
  }

  private async toAnnounceState(id: string, a: Announce): Promise<AnnounceState> {
    const meta = await this.appFirebase.getAnnounceMeta(id, a.mid);
    if (!meta) {
      return;
    }

    let iconData: string;
    if (meta.icon) {
      iconData = await this.appFirebase.getImage(meta.icon);
    }

    return { id, ...a, ...meta, iconData };
  }

  async loadUser() {
    await this.appFirebase.listenUser(async () => {
      const user = await this.appFirebase.getUser();
      this.appState.state.user = user;
    });
  }

  async loadAnnounces() {
    await this.loadUser();
    const user = this.appState.state.user;
    for (const id of user.announces) {
      await this.loadAnnounce(id);
    }
  }

  async loadAnnounce(id: string) {
    await this.appFirebase.listenAnnounce(id, async () => {
      const a = await this.appFirebase.getAnnounce(id);
      const m = new Map(this.appState.state.announces);
      if (!a) {
        m.delete(id);
      } else {
        const as = await this.toAnnounceState(id, a);
        m.set(id, as);
        this.appState.state.announces = m;
      }
    });
  }

  getAnnounces() {
    const user = this.appState.state.user;
    if (!user) {
      return;
    }

    const result: AnnounceState[] = [];
    for (const id of user.announces) {
      const as = this.appState.state.announces.get(id);
      if (as) {
        result.push(as);
      }
    }

    result.sort((v1, v2) => {
      return v2.uT - v1.uT;
    });

    return result;
  }

  getAnnounceState(id: string) {
    return this.appState.state.announces.get(id);
  }

  getPost(id: string, postID: string) {
    return this.appFirebase.getPost(id, postID);
  }

  getImage(id: string) {
    return this.appFirebase.getImage(id);
  }
}
