import { Component, Fragment, h, Host } from '@stencil/core';
import { AppEnv } from 'announsing-shared';
import { App } from 'src/app/app';
import { AppFirebase } from 'src/app/firebase';
import { AppMsg } from 'src/app/msg';
import { AppState } from 'src/app/state';
import { createRouter, Route } from 'stencil-router-v2';

const Router = createRouter();

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.scss',
})
export class AppRoot {
  private app: App;

  componentWillLoad() {
    const appEnv = new AppEnv();
    const appMsg = new AppMsg();
    const appFirebase = new AppFirebase(appEnv, appMsg);
    const appState = new AppState();
    this.app = new App(appMsg, appFirebase, appState, Router);
    return this.app.init();
  }

  componentWillRender() {
    /* TODO
    switch (Router.activePath) {
      case '/keygen':
        this.app.setTitle(this.app.msgs.keygen.title + suffix);
        break;
      case '/encrypt':
        this.app.setTitle(this.app.msgs.encrypt.title + suffix);
        break;
      case '/decrypt':
        this.app.setTitle(this.app.msgs.decrypt.title + suffix);
        break;
      case '/usage':
        this.app.setTitle(this.app.msgs.usage.title + suffix);
        break;
      default:
        this.app.setTitle(this.app.msgs.home.title + suffix);
        break;
    }
    */
  }

  private renderRoute(Tag: string, path: string) {
    return (
      <Route path={path}>
        <Tag app={this.app} class="page"></Tag>
      </Route>
    );
  }

  render() {
    const signIn = this.app.isSignIn;

    return (
      <Host>
        <Router.Switch>
          {signIn && (
            <Fragment>
              {this.renderRoute('app-home', '/')}
              {this.renderRoute('app-announce-create', '/a/create')}
              <Route path="/signin" to="/"></Route>
            </Fragment>
          )}
          {!signIn && (
            <Fragment>
              {this.renderRoute('app-signin', '/signin')}
              <Route path={/.*/} to="/signin"></Route>
            </Fragment>
          )}
        </Router.Switch>
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
      </Host>
    );
  }
}
