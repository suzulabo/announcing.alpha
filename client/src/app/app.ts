import { Build } from '@stencil/core';
import { AnnounceMeta, NotificationMode, Post } from 'announsing-shared';
import { Follow } from './datatypes';
import { AppFirebase } from './firebase';
import { AppMsg } from './msg';
import { AppState } from './state';
import { AppStorage } from './storage';

const BUILD_INFO = {
  src: '__BUILD_SRC__',
  time: parseInt('__BUILT_TIME__'),
} as const;

export class App {
  readonly buildInfo = BUILD_INFO;

  private apiSite: string;

  constructor(
    private appMsg: AppMsg,
    private appFirebase: AppFirebase,
    private appState: AppState,
    private appStorage: AppStorage,
  ) {
    if (Build.isDev) {
      this.apiSite = `http://${location.hostname}:5000`;
    } else {
      this.apiSite = location.origin.replace('console', 'api');
    }
  }

  async init() {
    await this.appFirebase.init();
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

  getAnnounce(id: string) {
    return this.appFirebase.getAnnounce(id);
  }

  private async fetchApi<T>(p: string) {
    const res = await fetch(`${this.apiSite}/${p}`);
    return (await res.json()) as T;
  }

  fetchAnnounceMeta(id: string, metaID: string) {
    return this.fetchApi<AnnounceMeta>(`announce/${id}/meta/${metaID}`);
  }

  fetchPost(id: string, postID: string) {
    return this.fetchApi<Post>(`announce/${id}/post/${postID}`);
  }

  getImageURI(id: string) {
    return `${this.apiSite}/image/${id}`;
  }

  getFollow(id: string) {
    return this.appStorage.follows.get(id);
  }

  setFollow(id: string, follow: Follow) {
    return this.appStorage.follows.set(id, follow);
  }

  async deleteFollow(id: string) {
    await this.appStorage.follows.remove(id);
  }

  registerMessaging(announceID: string, mode: NotificationMode, hours?: number[]) {
    console.log(mode);
    return this.appFirebase.registerMessaging(announceID, mode, hours);
  }
}
