import { Component, forceUpdate, h, Host, Listen } from '@stencil/core';
import { AppEnv } from 'announsing-shared';
import { App } from 'src/app/app';
import { AppFirebase } from 'src/app/firebase';
import { AppMsg } from 'src/app/msg';
import { AppState } from 'src/app/state';

interface MatchPathResult {
  tag?: string;
  params?: { [k: string]: string };
  to?: string;
}

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.scss',
})
export class AppRoot {
  private app: App;

  private rendering = false;
  private needUpdate = false;

  @Listen('popstate', { target: 'window' })
  handlePopState() {
    if (!this.rendering) {
      forceUpdate(this);
    } else {
      this.needUpdate = true;
    }
  }

  componentWillRender() {
    this.rendering = true;
  }

  componentDidRender() {
    if (this.needUpdate) {
      this.needUpdate = false;
      forceUpdate(this);
    }
    this.rendering = false;
  }

  componentWillLoad() {
    const appEnv = new AppEnv();
    const appMsg = new AppMsg();
    const appFirebase = new AppFirebase(appEnv, appMsg);
    const appState = new AppState();
    this.app = new App(appMsg, appFirebase, appState);
    return this.app.init();
  }

  private matchPath(p: string): MatchPathResult {
    {
      if (!this.app.isSignIn) {
        if (p == '/signin') {
          return {
            tag: 'app-signin',
          };
        } else {
          return {
            to: '/signin',
          };
        }
      }
    }

    if (p == '/a/create') {
      return { tag: 'app-announce-create' };
    }

    if (p == '/') {
      return { tag: 'app-home' };
    }

    return {
      to: '/',
    };
  }

  render() {
    const m = this.matchPath(location.pathname);
    if (m.to) {
      this.app.redirectRoute(m.to);
      return;
    }

    const Tag = m.tag;

    return (
      <Host>
        <Tag class="page" app={this.app} {...m.params} />
        <footer>
          <div class="title">{this.app.msgs.footer.title}</div>
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
