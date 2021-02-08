import { Build } from '@stencil/core';
import { AppAuth } from './auth';
import { AppData } from './data';
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
    private appAuth: AppAuth,
    private appData: AppData,
    private appState: AppState,
  ) {
    if (Build.isDev) {
      this.clientSite = `http://${location.hostname}:3371`;
    } else {
      this.clientSite = location.origin.replace('console', 'client');
    }
  }

  async init() {
    await Promise.all([this.appFirebase.init()]);
    this.appAuth.updateAuthState();
  }

  setTitle(v: string) {
    document.title = v;
  }

  get msgs() {
    return this.appMsg.msgs;
  }

  readonly state = this.appState.state as Readonly<AppState['state']>;

  readonly auth = this.appAuth;

  readonly data = this.appData;
}
