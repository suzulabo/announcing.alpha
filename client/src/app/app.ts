import { Http } from '@capacitor-community/http';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Build, readTask } from '@stencil/core';
import { AnnounceMetaJSON, AppEnv, PostJSON } from 'src/shared';
import nacl from 'tweetnacl';
import { DataResult, DATA_ERROR, Follow } from './datatypes';
import { AppFirebase } from './firebase';
import { AppIdbCache } from './idbcache';
import { AppMsg } from './msg';
import { AppState } from './state';
import { AppStorage } from './storage';
import { bs62 } from './utils';

const BUILD_INFO = {
  src: '__BUILD_SRC__',
  time: parseInt('__BUILT_TIME__'),
} as const;

export class App {
  readonly buildInfo = BUILD_INFO;

  private dataURLPrefix: string;

  constructor(
    private appEnv: AppEnv,
    private appMsg: AppMsg,
    private appFirebase: AppFirebase,
    private appState: AppState,
    private appStorage: AppStorage,
    private appIdbCache: AppIdbCache,
  ) {
    if (Build.isDev || Capacitor.getPlatform() == 'web') {
      this.dataURLPrefix = '/data';
    } else {
      this.dataURLPrefix = `${this.appEnv.env.sites.client}/data`;
    }
  }

  async init() {
    await Promise.all([this.appFirebase.init(), this.appIdbCache.init()]);

    // Check permission of notification
    // if not granted, clear local settings. Server settings will delete automatically.
    const permission = await this.appFirebase.checkNotifyPermission(false);
    if (permission != 'granted') {
      const ids = await this.appStorage.notifications.keys();
      for (const id of ids) {
        await this.appStorage.notifications.remove(id);
      }
    }

    await CapApp.addListener('appUrlOpen', data => {
      console.log('App opened with URL:', data);
      const url = new URL(data.url);
      this.pushRoute(url.pathname);
    });
  }

  private _title = '';
  setTitle(v: string) {
    this._title = v;
    readTask(() => {
      document.title = this._title;
    });
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
    const url = new URL(path, location.href);
    if (location.href == url.href) {
      return;
    }

    history.replaceState(history.state, '', url.pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  pushRoute(path: string, back?: boolean) {
    const url = new URL(path, location.href);
    if (location.href == url.href) {
      return;
    }

    if (back && history.state?.beforeRoute == url.pathname) {
      history.back();
    } else {
      history.pushState({ beforeRoute: location.pathname }, '', url.pathname);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  private _loading = false;
  set loading(v: boolean) {
    this._loading = v;
    this.setLoadingClass();
  }

  private setLoadingClass = () => {
    readTask(() => {
      const apLoading = document.querySelector('ap-loading');
      if (apLoading) {
        if (this._loading) {
          apLoading.classList.add('show');
        } else {
          apLoading.classList.remove('show');
        }
      }
    });
  };

  async processLoading(f: () => Promise<void>) {
    this.loading = true;
    try {
      await f();
    } finally {
      this.loading = false;
    }
  }

  get msgs() {
    return this.appMsg.msgs;
  }

  checkShareSupport() {
    if (Capacitor.getPlatform() != 'web') {
      return true;
    }
    if (navigator.share != null) {
      return true;
    }

    return false;
  }

  share(url: string) {
    return Share.share({ url });
  }

  loadAnnounce(id: string) {
    const cb = async () => {
      const announceState = this.appState.announce;
      const a = await this.appFirebase.getAnnounce(id);
      switch (a?.state) {
        case 'NOT_FOUND':
          announceState.set(id, a);
          break;
        case 'SUCCESS': {
          const meta = await this.fetchAnnounceMeta(id, a.value.mid);
          if (meta?.state != 'SUCCESS') {
            announceState.set(id, DATA_ERROR);
            return;
          }
          announceState.set(id, {
            state: 'SUCCESS',
            value: {
              id,
              ...a.value,
              ...meta.value,
              iconLoader: !meta.value.icon
                ? undefined
                : async () => {
                    const v = await this.fetchImage(meta.value.icon || '');
                    if (v?.state != 'SUCCESS') {
                      throw new Error('fetch error');
                    }
                    return v.value;
                  },
            },
          });
          const follow = await this.getFollow(id);
          if (follow && follow.name != meta.value.name) {
            follow.name = meta.value.name;
            await this.setFollow(id, follow);
          }
          break;
        }
        default:
          announceState.delete(id);
      }
    };

    this.appFirebase.listenAnnounce(id, cb);

    void cb();
  }

  getAnnounceState(id: string) {
    return this.appState.announce.get(id);
  }

  private async fetchData<T>(
    p: string,
    responseType: 'blob' | 'json' = 'json',
  ): Promise<DataResult<T> | undefined> {
    const cacheKey = `fetch:${p}`;
    {
      const v = await this.appIdbCache.get<T>(cacheKey);
      if (v) {
        console.debug('hit fetch cache', p);
        return { state: 'SUCCESS', value: v };
      }
    }

    const res = await Http.request({
      method: 'GET',
      url: `${this.dataURLPrefix}/${p}`,
      responseType,
    });
    if (res.status == 200) {
      const dataType = typeof res.data;
      if (responseType == 'json' && dataType == 'object') {
        await this.appIdbCache.set(cacheKey, res.data);
        return { state: 'SUCCESS', value: res.data };
      }
      if (dataType == 'string') {
        await this.appIdbCache.set(cacheKey, res.data);
        return { state: 'SUCCESS', value: res.data };
      }
    }

    if (res.status == 404) {
      return;
    }

    console.error(`Fetch Error (${res.status})`, res.data);
    return DATA_ERROR;
  }

  fetchAnnounceMeta(id: string, metaID: string) {
    return this.fetchData<AnnounceMetaJSON>(`announces/${id}/meta/${metaID}`);
  }

  fetchPost(id: string, postID: string) {
    return this.fetchData<PostJSON>(`announces/${id}/posts/${postID}`);
  }

  async fetchImage(id: string) {
    const v = await this.fetchData<string>(`images/${id}`, 'blob');
    if (v?.state != 'SUCCESS') {
      return v;
    }
    return { state: 'SUCCESS', value: `data:image/jpeg;base64,${v.value}` };
  }

  getImageURI(id: string) {
    return `${this.dataURLPrefix}/images/${id}`;
  }

  getFollows() {
    return this.appStorage.follows.entries();
  }

  getFollow(id: string) {
    return this.appStorage.follows.get(id);
  }

  async setFollow(id: string, follow: Follow) {
    if (!(await this.getFollow(id))) {
      return this.appStorage.follows.set(id, follow);
    }
  }

  async setReadTime(id: string, pT: number) {
    const follow = await this.getFollow(id);
    if (follow && follow.readTime < pT) {
      follow.readTime = pT;
      return this.appStorage.follows.set(id, follow);
    }
  }

  async deleteFollow(id: string) {
    await this.setNotify(id, false);
    await this.appStorage.follows.remove(id);
  }

  async getNotification(id: string) {
    return this.appStorage.notifications.get(id);
  }

  async checkNotifyPermission(ask: boolean) {
    return this.appFirebase.checkNotifyPermission(ask);
  }

  async setNotify(announceID: string, enable: boolean, hours?: number[]) {
    if (!enable) {
      const permission = await this.appFirebase.checkNotifyPermission(false);
      if (permission != 'granted') {
        await this.appStorage.notifications.remove(announceID);
        return;
      }
    }

    const follows = {} as { [id: string]: { hours?: number[] } };

    const notifications = await this.appStorage.notifications.entries();
    for (const [k, v] of notifications) {
      if (k != announceID) {
        follows[k] = v;
      }
    }
    if (enable) {
      follows[announceID] = { hours };
    }

    const signKey = await this.getSignKey();
    await this.appFirebase.registerMessaging(signKey, this.appMsg.lang, follows);

    if (enable) {
      await this.appStorage.notifications.set(announceID, { hours });
    } else {
      await this.appStorage.notifications.remove(announceID);
    }
  }

  private async getSignKey() {
    const k = await this.appStorage.signKey.get();
    if (k) {
      return k;
    }
    const pair = nacl.sign.keyPair();
    const s = bs62.encode(pair.secretKey);
    await this.appStorage.signKey.set(s);
    return s;
  }
}
