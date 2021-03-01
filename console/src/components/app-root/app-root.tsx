import { Component, h, Host, Listen, State } from '@stencil/core';
import { AppEnv } from 'announsing-shared';
import { App } from 'src/app/app';
import { AppFirebase } from 'src/app/firebase';
import { AppMsg } from 'src/app/msg';
import { AppState } from 'src/app/state';

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

  @State()
  reload: object;

  @Listen('popstate', { target: 'window' })
  handlePopState() {
    const r = this.checkRedirect();
    if (r) {
      this.app.redirectRoute(r);
      return;
    }

    this.reload = {};
  }

  async componentWillLoad() {
    const appEnv = new AppEnv();
    const appMsg = new AppMsg();
    const appFirebase = new AppFirebase(appEnv, appMsg);
    const appState = new AppState();
    this.app = new App(appMsg, appFirebase, appState);
    await this.app.init();
    this.handlePopState();
  }

  private checkRedirect() {
    const p = location.pathname;

    if (this.app.isSignIn) {
      if (p == '/signin') {
        return '/';
      }
    } else {
      if (p != '/signin') {
        return '/signin';
      }
    }

    if (!this.getRoute()) {
      return '/';
    }
  }

  private staticRouteMap = new Map([
    ['/signin', 'app-signin'],
    ['/a/create', 'app-announce-create'],
    ['/', 'app-home'],
  ]);

  private getRoute(): MatchPathResult {
    const p = location.pathname;

    {
      const t = this.staticRouteMap.get(p);
      if (t) {
        return { tag: t };
      }
    }

    const l = p.split('/');
    l.shift();
    {
      if (l[0] == 'a') {
        const [, announceID, page, postID] = l;
        switch (page) {
          case 'edit':
            return { tag: 'app-announce-edit', params: { announceID } };
          case 'p':
            if (postID) {
              return { tag: 'app-post', params: { announceID, postID } };
            }
            return { tag: 'app-posts', params: { announceID } };
          case 'f':
            return { tag: 'app-post-form', params: { announceID } };
        }
      }
    }
  }

  render() {
    const m = this.getRoute();

    return (
      <Host>
        <m.tag class="page" app={this.app} {...m.params} />
        <footer>
          <div class="title">
            <a {...this.app.href('/')}>{this.app.msgs.footer.title}</a>
          </div>
          <div class="copy">&copy;suzulabo</div>
          <div class="build-info">Version: {this.app.buildInfo.src}</div>
          <div class="build-info">Built at {new Date(this.app.buildInfo.time).toISOString()}</div>
          <div class="github">
            <a href="https://github.com/suzulabo/announsing">
              <ap-icon icon="github" />
            </a>
          </div>
        </footer>
        <ap-loading class={{ show: this.app.loading }} />
      </Host>
    );
  }
}
