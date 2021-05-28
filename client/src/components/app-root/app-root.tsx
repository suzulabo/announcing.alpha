import { Component, h, Host, Listen, State } from '@stencil/core';
import { App } from 'src/app/app';
import { PostNotificationRecievedEvent } from 'src/app/datatypes';
import { AppFirebase } from 'src/app/firebase';
import { AppIdbCache } from 'src/app/idbcache';
import { AppMsg } from 'src/app/msg';
import { AppState } from 'src/app/state';
import { AppStorage } from 'src/app/storage';
import { AppEnv } from '@announcing-shared';
import { Match, pathMatcher } from '@announcing-shared/path-matcher';

const matches: (Match & { tag: string })[] = [
  {
    pattern: '',
    tag: 'app-home',
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

interface MatchPathResult {
  tag: string;
  params?: { [k: string]: string };
}

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

  @State()
  path?: string;

  @Listen('popstate', { target: 'window' })
  handlePopState() {
    const r = this.checkRedirect();
    if (r) {
      this.app.redirectRoute(r);
      return;
    }

    const p = location.pathname;
    this.path = p;
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
    this.handlePopState();
  }

  private checkRedirect() {
    if (!this.getRoute()) {
      return '/';
    }
    return;
  }

  private getRoute(): MatchPathResult | undefined {
    const p = location.pathname;

    const r = pathMatcher(matches, p);
    if (!r) {
      return;
    }

    if (r.match.tag == 'app-image') {
      r.params['backPath'] = `/${r.params.announceID}/${r.params.postID}`;
    }

    return {
      tag: r.match.tag,
      params: r.params,
    };
  }

  render() {
    this.app.setTitle('');

    const m = this.getRoute();

    return (
      <Host>
        {m && <m.tag class="page" app={this.app} {...m.params} />}
        <footer>
          <div class="title">
            <a {...this.app.href('/')}>{this.app.msgs.footer.title}</a>
          </div>
          <div class="build-info">Version: {this.app.buildInfo.src}</div>
          <div class="build-info">Built at {new Date(this.app.buildInfo.time).toISOString()}</div>
          <div class="github">
            <a href="https://github.com/suzulabo/announcing">
              <ap-icon icon="github" />
            </a>
          </div>
          <ap-root />
        </footer>
      </Host>
    );
  }
}
