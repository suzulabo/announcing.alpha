import { Build, readTask } from '@stencil/core';
import { Announce, AppEnv } from 'src/shared';
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

  get isSignIn() {
    return this.appState.state.signIn;
  }

  async signOut() {
    this.appFirebase.releaseListeners();
    await this.appFirebase.signOut();
  }

  signInGoogle(keep: boolean) {
    return this.appFirebase.signInGoogle(keep);
  }

  signInTwitter(keep: boolean) {
    return this.appFirebase.signInTwitter(keep);
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

    const iconData = meta.icon ? await this.appFirebase.getImage(meta.icon) : undefined;

    return {
      id,
      ...a,
      ...meta,
      ...(iconData && {
        iconData,
        iconLoader: () => {
          return Promise.resolve(iconData);
        },
      }),
    };
  }

  async loadUser() {
    await this.appFirebase.listenUser(async () => {
      const user = await this.appFirebase.getUser();
      this.appState.state.user = user;
      if (user && user.announces) {
        for (const id of user.announces) {
          await this.loadAnnounce(id, false);
        }
      }
    });
  }

  async loadAnnounce(id: string, checkOwner = true) {
    if (checkOwner) {
      const user = await this.appFirebase.getUser();
      if (!user || !user.announces.includes(id)) {
        return;
      }
    }

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

  getAnnounces() {
    const user = this.appState.state.user;
    if (!user) {
      return;
    }

    const result: AnnounceState[] = [];
    if (user && user.announces) {
      for (const id of user.announces) {
        const as = this.appState.state.announces.get(id);
        if (as) {
          result.push(as);
        }
      }
    }

    result.sort((v1, v2) => {
      return v2.uT.toMillis() - v1.uT.toMillis();
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
