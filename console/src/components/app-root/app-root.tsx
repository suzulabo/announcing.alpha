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
  path: string;

  @Listen('popstate', { target: 'window' })
  handlePopState() {
    const r = this.checkRedirect();
    if (r) {
      this.app.redirectRoute(r);
      return;
    }

    this.path = location.pathname;
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
    ['/create', 'app-announce-create'],
    ['/', 'app-home'],
  ]);
  private announceIDPattern = /^[A-Z0-9]{12}$/;
  private postIDPattern = /^[a-zA-Z0-9]+$/;

  private getRoute(): MatchPathResult {
    const p = location.pathname;

    {
      const t = this.staticRouteMap.get(p);
      if (t) {
        return { tag: t };
      }
    }

    b: {
      const l = p.split('/');
      l.shift();
      if (l.length > 3) {
        break b;
      }

      const [announceID, postID, postEdit] = l;
      if (!this.announceIDPattern.test(announceID)) {
        break b;
      }

      if (!!postEdit) {
        if (postEdit == 'edit_') {
          return { tag: 'app-post-form', params: { announceID, postID } };
        }
        break b;
      }

      if (!!postID) {
        if (postID == 'edit_') {
          return { tag: 'app-announce-edit', params: { announceID } };
        }
        if (postID == 'post_') {
          return { tag: 'app-post-form', params: { announceID } };
        }
        if (this.postIDPattern.test(postID)) {
          return { tag: 'app-post', params: { announceID, postID } };
        }
      } else {
        return { tag: 'app-posts', params: { announceID } };
      }
    }
  }

  render() {
    const m = this.getRoute();
    console.log(m);

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
