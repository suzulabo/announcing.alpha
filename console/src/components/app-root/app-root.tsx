import { Component, h, Host } from '@stencil/core';
import { App } from 'src/app/app';
import { AppFirebase } from 'src/app/firebase';
import { AppMsg } from 'src/app/msg';
import { AppState } from 'src/app/state';
import { AppEnv } from 'src/shared';
import { RouteMatch } from 'src/shared-ui/ap-root/ap-root';

const matches: RouteMatch[] = [
  {
    pattern: '',
    tag: 'app-home',
  },
  {
    pattern: 'signin',
    tag: 'app-signin',
  },
  {
    pattern: 'about',
    tag: 'app-about',
  },
  {
    pattern: 'create',
    tag: 'app-announce-create',
  },
  {
    pattern: /^[0-9A-Z]{12}$/,
    name: 'announceID',
    tag: 'app-announce',
    nexts: [
      {
        pattern: 'edit',
        tag: 'app-announce-edit',
      },
      {
        pattern: 'post',
        tag: 'app-post-form',
      },
      {
        pattern: /^[0-9a-zA-Z]{8}$/,
        name: 'postID',
        tag: 'app-post',
        nexts: [
          {
            pattern: 'edit',
            tag: 'app-post-form',
          },
        ],
      },
    ],
  },
];

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.scss',
})
export class AppRoot {
  private app: App;

  constructor() {
    const appMsg = new AppMsg();
    const apError = document.querySelector('ap-error');
    if (apError) {
      apError.msgs = appMsg.msgs.error;
    }

    const appEnv = new AppEnv();
    const appState = new AppState();
    const appFirebase = new AppFirebase(appEnv, appState, appMsg);
    this.app = new App(appEnv, appMsg, appFirebase, appState);
  }

  async componentWillLoad() {
    await this.app.init();
  }

  private handleRedirect = (p: string) => {
    if (this.app.isSignIn) {
      if (p == '/signin') {
        return '/';
      }
    } else {
      if (p != '/signin') {
        return '/signin';
      }
    }
    return;
  };

  render() {
    return (
      <Host>
        <ap-root
          routeMatches={matches}
          redirect={this.handleRedirect}
          componentProps={{ app: this.app }}
        />
      </Host>
    );
  }
}
