import { Build, readTask } from '@stencil/core';
import { Announce, AppEnv, DataResult, DATA_ERROR } from 'src/shared';
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

  private async toAnnounceState(id: string, a: Announce): Promise<DataResult<AnnounceState>> {
    const meta = await this.appFirebase.getAnnounceMeta(id, a.mid);
    if (!meta) {
      return DATA_ERROR;
    }

    const icon = meta.icon;

    return {
      state: 'SUCCESS',
      value: {
        id,
        ...a,
        ...meta,
        ...(icon && {
          iconLoader: async () => {
            const d = await this.appFirebase.getImage(icon);
            if (d) {
              return `data:image/jpeg;base64,${d.data.toBase64()}`;
            }
            throw new Error('icon load error');
          },
        }),
      },
    };
  }

  loadUser() {
    if (this.appState.user.get() != null) {
      return;
    }

    const cb = async () => {
      const user = await this.appFirebase.getUser();
      if (!user) {
        this.appState.user.set({});
        return;
      }
      this.appState.user.set(user);
      if (user.announces) {
        for (const id of user.announces) {
          this.loadAnnounce(id);
        }
      }
    };

    this.appFirebase.listenUser(cb);

    void cb();
  }

  private loadAnnounce(id: string) {
    const cb = async () => {
      const a = await this.appFirebase.getAnnounce(id);
      if (!a) {
        this.appState.announce.delete(id);
        return;
      }
      if (a) {
        const as = await this.toAnnounceState(id, a);
        this.appState.announce.set(id, as);
        return;
      }
      this.appState.announce.set(id, a);
    };

    this.appFirebase.listenAnnounce(id, cb);

    void cb();
  }

  getAnnounces() {
    const user = this.appState.user.get();
    if (!user) {
      return;
    }

    const result: AnnounceState[] = [];
    if (user.announces) {
      for (const id of user.announces) {
        const as = this.appState.announce.get(id);
        if (as?.state == 'SUCCESS') {
          result.push(as.value);
        }
      }
    }

    result.sort((v1, v2) => {
      return v2.uT.toMillis() - v1.uT.toMillis();
    });

    return result;
  }

  getAnnounceState(id: string) {
    return this.appState.announce.get(id);
  }

  getPost(id: string, postID: string) {
    return this.appFirebase.getPost(id, postID);
  }

  async getImage(id: string) {
    const d = await this.appFirebase.getImage(id);
    if (d) {
      return `data:image/jpeg;base64,${d.data.toBase64()}`;
    }
    return;
  }
}
