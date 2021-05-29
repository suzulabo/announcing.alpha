import { Match, pathMatcher } from '@announcing-shared/path-matcher';
import { RouterEventDetail } from '@ionic/core';
import { Component, h, Host, Prop, State } from '@stencil/core';

export type RouteMatch = Match & { url: string; tag?: string };

@Component({
  tag: 'ap-root',
  styleUrl: 'ap-root.scss',
})
export class ApRoot {
  @Prop()
  routeMatches!: RouteMatch[];

  @Prop()
  componentProps?: { [k: string]: any };

  @Prop()
  defaultPath = '/';

  @State()
  routes: any;

  componentWillLoad() {
    this.updateRoutes();
  }

  private updateRoutes() {
    const routes = [] as any[];
    const genRoute = (mm: RouteMatch[], prefix = '') => {
      return mm.map(m => {
        const url = `${prefix}${m.url}`;
        const tag = m.tag;
        if (tag) {
          routes.push(
            <ion-route
              data-url={url}
              url={url}
              component={tag}
              componentProps={this.componentProps}
            ></ion-route>,
          );
        }
        if (m.nexts) genRoute(m.nexts, url);
      });
    };
    genRoute(this.routeMatches);
    this.routes = routes;
  }

  private routeWillChange = (event: CustomEvent<RouterEventDetail>) => {
    const m = pathMatcher(this.routeMatches, event.detail.to);
    if (!m) {
      void document.querySelector('ion-router')?.push(this.defaultPath, 'root');
    }
  };

  render() {
    return (
      <Host>
        <ion-app>
          <ion-router useHash={false} onIonRouteWillChange={this.routeWillChange}>
            {this.routes}
          </ion-router>
          <ion-nav />
        </ion-app>
      </Host>
    );
  }
}
