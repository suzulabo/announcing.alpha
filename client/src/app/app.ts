import { Http } from '@capacitor-community/http';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Build } from '@stencil/core';
import { Announce, AnnounceMetaBase, AnnounceMetaJSON, AppEnv, PostJSON } from 'src/shared';
import { LazyPromiseState } from 'src/shared-ui/utils/promise';
import { pushRoute } from 'src/shared-ui/utils/route';
import nacl from 'tweetnacl';
import { ClientConfig, Follow } from './datatypes';
import { AppFirebase } from './firebase';
import { AppIdbCache } from './idbcache';
import { AppMsg } from './msg';
import { AppStorage } from './storage';
import { bs62 } from './utils';

const BUILD_INFO = {
  src: '__BUILD_SRC__',
  time: parseInt('__BUILT_TIME__'),
} as const;

export class App {
  readonly buildInfo = BUILD_INFO;

  private dataURLPrefix: string;
  readonly clientSite: string;
  readonly manualSite: string;

  constructor(
    private appEnv: AppEnv,
    private appMsg: AppMsg,
    private appFirebase: AppFirebase,
    private appStorage: AppStorage,
    private appIdbCache: AppIdbCache,
  ) {
    if (Build.isDev || Capacitor.getPlatform() == 'web') {
      this.dataURLPrefix = '/data';
      this.clientSite = location.origin;
    } else {
      this.dataURLPrefix = `${this.appEnv.env.sites.client}/data`;
      this.clientSite = this.appEnv.env.sites.client;
    }
    this.manualSite = `${this.appEnv.env.sites.docs}/manual/#/${this.appMsg.lang}/`;
  }

  async init() {
    const apError = document.querySelector('ap-error');
    if (apError) {
      apError.msgs = this.appMsg.msgs.error;
    }
    await Promise.all([this.appFirebase.init(), this.appIdbCache.init(), this.appStorage.init()]);

    await CapApp.addListener('appUrlOpen', data => {
      console.log('App opened with URL:', data);
      const url = new URL(data.url);
      pushRoute(url.pathname);
    });
    await CapApp.addListener('backButton', () => {
      window.history.back();
      window.dispatchEvent(new CustomEvent<void>('AppBackButton'));
    });
  }

  async processLoading(f: () => Promise<void>) {
    const loading = document.querySelector('ap-loading');
    loading?.classList.add('show');
    try {
      await f();
    } finally {
      loading?.classList.remove('show');
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

  exitApp() {
    CapApp.exitApp();
  }

  share(url: string) {
    return Share.share({ url });
  }

  async getAnnounceAndMeta(
    id: string,
    temporary?: boolean,
  ): Promise<(Announce & AnnounceMetaBase) | undefined> {
    const a = await this.appFirebase.getAnnounce(id, temporary);
    if (!a) {
      return;
    }
    const meta = await this.fetchAnnounceMeta(id, a.mid);
    if (!meta) {
      throw new Error(`fetchAnnounceMeta: ${id}/${a.mid}`);
    }

    return { ...a, ...meta };
  }

  latestPost(a: Announce) {
    const posts = Object.entries(a.posts);
    let latest = posts.shift();
    if (!latest) {
      return;
    }
    for (const post of posts) {
      if (post[1].pT.toMillis() > latest[1].pT.toMillis()) {
        latest = post;
      }
    }

    return latest;
  }

  async getLatestPost(id: string, a: Announce) {
    const latest = this.latestPost(a);
    if (!latest) {
      return;
    }
    const post = await this.fetchPost(id, latest[0]);
    return post;
  }

  getPosts(id: string, a: Announce) {
    const postsPromises: Record<string, LazyPromiseState<PostJSON>> = {};
    for (const postID of Object.keys(a.posts)) {
      postsPromises[postID] = new LazyPromiseState(() => {
        return this.fetchPost(id, postID);
      });
    }
    return postsPromises;
  }

  private async fetchData<T>(
    p: string,
    responseType: 'blob' | 'json' = 'json',
  ): Promise<T | undefined> {
    const cacheKey = `fetch:${p}`;
    {
      const v = await this.appIdbCache.get<T>(cacheKey);
      if (v) {
        // console.debug('hit fetch cache', p);
        return v;
      }
    }

    const url = `${this.dataURLPrefix}/${p}`;
    const res = await Http.request({
      method: 'GET',
      url,
      responseType,
    });
    if (res.status == 200) {
      const dataType = typeof res.data;
      const ok = (dataType == 'object' && responseType == 'json') || dataType == 'string';
      if (ok) {
        await this.appIdbCache.set(cacheKey, res.data);
        return res.data as T;
      }
    }

    if (res.status == 404) {
      return;
    }

    console.error(`Fetch Error: ${url}(${res.status})`, res.data);
    throw new Error(`Fetch Error: ${url}(${res.status})`);
  }

  fetchAnnounceMeta(id: string, metaID: string) {
    return this.fetchData<AnnounceMetaJSON>(`announces/${id}/meta/${metaID}`);
  }

  fetchPost(id: string, postID: string) {
    return this.fetchData<PostJSON>(`announces/${id}/posts/${postID}`);
  }

  async fetchImage(id: string) {
    const v = await this.fetchData<string>(`images/${id}`, 'blob');
    if (v) {
      return `data:image/jpeg;base64,${v}`;
    }
    return;
  }

  getFollows() {
    return this.appStorage.follows.entries();
  }

  getFollow(id: string) {
    return this.appStorage.follows.get(id);
  }

  async setFollow(id: string, follow: Follow) {
    await this.appStorage.follows.set(id, follow);
  }

  async setReadTime(id: string, pT: number) {
    const follow = this.getFollow(id);
    if (follow && follow.readTime < pT) {
      follow.readTime = pT;
      await this.appStorage.follows.set(id, follow);
    }
  }

  async deleteFollow(id: string) {
    await this.appStorage.follows.remove(id);
  }

  getNotification(id: string) {
    return this.appStorage.notifications.get(id);
  }

  async checkNotifyPermission(ask: boolean) {
    return this.appFirebase.checkNotifyPermission(ask);
  }

  async setNotify(announceID: string, enable: boolean) {
    if (!enable) {
      const permission = await this.appFirebase.checkNotifyPermission(false);
      if (permission != 'granted') {
        await this.appStorage.notifications.remove(announceID);
        return;
      }
    }

    const permission = await this.appFirebase.checkNotifyPermission(true);
    if (permission != 'granted') {
      return;
    }

    const announces = new Set(this.appStorage.notifications.keys());
    if (enable) {
      announces.add(announceID);
    } else {
      announces.delete(announceID);
    }

    const signKey = await this.getSignKey();
    await this.appFirebase.registerMessaging(signKey, this.appMsg.lang, Array.from(announces));

    if (enable) {
      await this.appStorage.notifications.set(announceID, {});
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

  getConfig() {
    return this.appStorage.config.get() || {};
  }

  async setConfig(v: ClientConfig) {
    await this.appStorage.config.set(v);
  }
}
