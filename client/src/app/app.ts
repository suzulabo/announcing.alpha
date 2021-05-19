import { Http } from '@capacitor-community/http';
import { App as CapApp } from '@capacitor/app';
import { Device, DeviceInfo } from '@capacitor/device';
import { Share } from '@capacitor/share';
import { Build, readTask } from '@stencil/core';
import { Announce, AnnounceMetaJSON, AppEnv, PostJSON } from 'src/shared';
import nacl from 'tweetnacl';
import { AnnounceState, Follow } from './datatypes';
import { AppFirebase } from './firebase';
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
  private deviceInfo: DeviceInfo;

  constructor(
    private appEnv: AppEnv,
    private appMsg: AppMsg,
    private appFirebase: AppFirebase,
    private appState: AppState,
    private appStorage: AppStorage,
  ) {}

  async init() {
    this.deviceInfo = await Device.getInfo();

    if (Build.isDev || this.deviceInfo.platform == 'web') {
      this.dataURLPrefix = '/data';
    } else {
      this.dataURLPrefix = `${this.appEnv.env.sites.client}/data`;
    }

    await this.appFirebase.init();

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

  setTitle(v: string) {
    document.title = v;
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

    history.replaceState(history.state, null, url.pathname);
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
      history.pushState({ beforeRoute: location.pathname }, null, url.pathname);
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
      if (this._loading) {
        apLoading.classList.add('show');
      } else {
        apLoading.classList.remove('show');
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
    if (this.deviceInfo.platform != 'web') {
      return true;
    }
    if (navigator.share) {
      return true;
    }

    return false;
  }

  share(url: string) {
    return Share.share({ url });
  }

  private async toAnnounceState(id: string, a: Announce): Promise<AnnounceState> {
    const meta = await this.fetchAnnounceMeta(id, a.mid);
    if (!meta) {
      return;
    }

    return { id, ...a, ...meta, ...(!!meta.icon && { iconData: this.getImageURI(meta.icon) }) };
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
      }
      this.appState.state.announces = m;
    });
  }

  getAnnounceState(id: string) {
    return this.appState.state.announces.get(id);
  }

  private async fetchData<T>(p: string) {
    const res = await Http.request({ method: 'GET', url: `${this.dataURLPrefix}/${p}` });
    if (res.status == 200) {
      return res.data as T;
    }
  }

  fetchAnnounceMeta(id: string, metaID: string) {
    return this.fetchData<AnnounceMetaJSON>(`announces/${id}/meta/${metaID}`);
  }

  fetchPost(id: string, postID: string) {
    return this.fetchData<PostJSON>(`announces/${id}/posts/${postID}`);
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
