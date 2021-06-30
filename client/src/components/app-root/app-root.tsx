import { Component, h, Host, Listen } from '@stencil/core';
import { App } from 'src/app/app';
import { PostNotificationRecievedEvent } from 'src/app/datatypes';
import { AppFirebase } from 'src/app/firebase';
import { AppIdbCache } from 'src/app/idbcache';
import { AppMsg } from 'src/app/msg';
import { AppStorage } from 'src/app/storage';
import { AppEnv } from 'src/shared';
import { RouteMatch } from 'src/shared-ui/ap-root/ap-root';
import { pushRoute } from 'src/shared-ui/utils/route';

const matches: RouteMatch[] = [
  {
    pattern: '',
    tag: 'app-home',
  },
  {
    pattern: 'config',
    tag: 'app-config',
  },
  {
    pattern: 'about',
    tag: 'app-about',
  },
  {
    pattern: /^[0-9A-Z]{12}$/,
    name: 'announceID',
    tag: 'app-announce',
    nexts: [
      {
        pattern: 'config',
        tag: 'app-announce-config',
      },
      {
        pattern: /^[0-9a-zA-Z]{8}$/,
        name: 'postID',
        tag: 'app-post',
        nexts: [
          {
            pattern: 'image',
            nexts: [
              {
                pattern: /^[0-9a-zA-Z]{15,25}$/,
                name: 'imageID',
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
    const appStorage = new AppStorage();
    const appIdbCache = new AppIdbCache();
    this.app = new App(appEnv, appMsg, appFirebase, appStorage, appIdbCache);
  }

  @Listen('PostNotificationRecieved', { target: 'window' })
  handlePostNotificationRecieved(event: PostNotificationRecievedEvent) {
    console.debug('PostNotificationRecieved', event.detail.announceID, event.detail.postID);
    const p = `/${event.detail.announceID}/${event.detail.postID}`;
    if (this.app) {
      pushRoute(p);
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
