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
    this.appState.updateSignIn(this.appFirebase.user != null);
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

  async signOut() {
    await this.appFirebase.signOut();
    this.appState.updateSignIn(this.appFirebase.user != null);
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
    this.listenUser();
    const user = await this.appFirebase.getUser();
    if (!user.announces || user.announces.indexOf(id) < 0) {
      return;
    }

    const a = await this.appFirebase.getAnnounce(id);
    if (a) {
      return await this.toAnnounceState(id, a);
    }
  }

  getPost(id: string, postID: string) {
    return this.appFirebase.getPost(id, postID);
  }

  getImage(id: string) {
    return this.appFirebase.getImage(id);
  }
}
