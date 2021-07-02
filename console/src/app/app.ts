import { Build, readTask } from '@stencil/core';
import { Announce, AnnounceMetaBase, AppEnv, PostJSON } from 'src/shared';
import { LazyPromiseState, PromiseState } from 'src/shared-ui/utils/promise';
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
  readonly manualSite: string;

  constructor(
    appEnv: AppEnv,
    private appMsg: AppMsg,
    private appFirebase: AppFirebase,
    private appState: AppState,
  ) {
    if (Build.isDev) {
      this.clientSite = `http://${location.hostname}:${parseInt(location.port) + 1}`;
    } else {
      this.clientSite = appEnv.env.sites.client;
    }
    this.manualSite = `${appEnv.env.sites.docs}/manual/#/${this.appMsg.lang}/publisher`;
  }

  async init() {
    await this.appFirebase.init();
  }

  setTitle(v: string) {
    document.title = v;
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

  get isSignIn() {
    return this.appState.signIn.get();
  }

  async signOut() {
    await this.appFirebase.signOut();
  }

  signInGoogle(keep: boolean) {
    return this.appFirebase.signIn(keep, 'google');
  }

  signInTwitter(keep: boolean) {
    return this.appFirebase.signIn(keep, 'twitter');
  }

  createAnnounce(name: string, desc: string) {
    return this.appFirebase.callCreateAnnounce({ name, desc });
  }

  editAnnounce(
    id: string,
    name: string,
    desc?: string,
    link?: string,
    icon?: string,
    newIcon?: string,
  ) {
    return this.appFirebase.callEditAnnounce({ id, name, desc, link, icon, newIcon });
  }

  putPost(
    id: string,
    title?: string,
    body?: string,
    link?: string,
    imgData?: string,
    editID?: string,
  ) {
    return this.appFirebase.callPutPost({ id, title, body, link, imgData, editID });
  }

  deleteAnnounce(id: string) {
    return this.appFirebase.callDeleteAnnounce({ id });
  }

  deletePost(id: string, postID: string) {
    return this.appFirebase.callDeletePost({ id, postID });
  }

  getUser() {
    return this.appFirebase.getUser();
  }

  async getAnnounceAndMeta(id: string): Promise<(Announce & AnnounceMetaBase) | undefined> {
    const user = await this.getUser();
    if (!user) {
      return;
    }
    if (!user.announces?.includes(id)) {
      return;
    }

    const a = await this.appFirebase.getAnnounce(id);
    if (!a) {
      return;
    }
    const meta = await this.appFirebase.getAnnounceMeta(id, a.mid);
    if (!meta) {
      throw new Error(`fetchAnnounceMeta: ${id}/${a.mid}`);
    }

    return { ...a, ...meta };
  }

  getPosts(id: string, a: Announce) {
    const postsPromises: Record<string, PromiseState<PostJSON>> = {};
    for (const postID of Object.keys(a.posts)) {
      postsPromises[postID] = new LazyPromiseState(async () => {
        const post = await this.getPost(id, postID);
        return { ...post, pT: post?.pT.toMillis() || 0 };
      });
    }
    return postsPromises;
  }

  getPost(id: string, postID: string) {
    return this.appFirebase.getPost(id, postID);
  }

  async getPostJSON(id: string, postID: string): Promise<PostJSON | undefined> {
    const post = await this.appFirebase.getPost(id, postID);
    if (post) {
      return { ...post, pT: post.pT.toMillis() };
    }
    return;
  }

  async getImage(id: string) {
    const d = await this.appFirebase.getImage(id);
    if (d) {
      return `data:image/jpeg;base64,${d.data.toBase64()}`;
    }
    return;
  }
}
