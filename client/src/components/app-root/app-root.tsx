import { AppEnv } from '@announcing-shared';
import { RouteMatch } from '@announcing-shared-ui';
import { Component, h, Host, Listen } from '@stencil/core';
import { App } from 'src/app/app';
import { PostNotificationRecievedEvent } from 'src/app/datatypes';
import { AppFirebase } from 'src/app/firebase';
import { AppIdbCache } from 'src/app/idbcache';
import { AppMsg } from 'src/app/msg';
import { AppState } from 'src/app/state';
import { AppStorage } from 'src/app/storage';

const matches: RouteMatch[] = [
  {
    url: '/',
    pattern: '',
    tag: 'app-home',
  },
  {
    url: '/:announceID',
    pattern: /^[0-9A-Z]{12}$/,
    tag: 'app-announce',
    nexts: [
      {
        url: '/config',
        pattern: 'config',
        tag: 'app-announce-config',
      },
      {
        url: '/:postID',
        pattern: /^[0-9a-zA-Z]{8}$/,
        tag: 'app-post',
        nexts: [
          {
            url: '/image',
            pattern: 'image',
            nexts: [
              {
                url: '/:imageID',
                pattern: /^[0-9a-zA-Z]{15,25}$/,
                tag: 'app-image',
              },
            ],
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
      //apError.msgs = appMsg.msgs.error;
    }
    const appEnv = new AppEnv();
    const appFirebase = new AppFirebase(appEnv);
    const appState = new AppState();
    const appStorage = new AppStorage();
    const appIdbCache = new AppIdbCache();
    this.app = new App(appEnv, appMsg, appFirebase, appState, appStorage, appIdbCache);
  }

  @Listen('PostNotificationRecieved', { target: 'window' })
  handlePostNotificationRecieved(event: PostNotificationRecievedEvent) {
    console.debug('PostNotificationRecieved', event.detail.announceID, event.detail.postID);
    const p = `/${event.detail.announceID}/${event.detail.postID}`;
    if (this.app) {
      this.app.pushRoute(p);
    } else {
      location.href = p;
    }
  }

  async componentWillLoad() {
    await this.app.init();
  }

  render() {
    return (
      <Host>
        <ap-root routeMatches={matches} componentProps={{ app: this.app }} />
      </Host>
    );
  }
}
