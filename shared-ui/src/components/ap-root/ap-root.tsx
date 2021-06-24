import { Component, Element, h, Host, Listen, Prop, State } from '@stencil/core';
import { Match, pathMatcher } from 'src/shared/path-matcher';
import { redirectRoute } from '../utils/route';

export type RouteMatch = Match & { tag?: string };

@Component({
  tag: 'ap-root',
  styleUrl: 'ap-root.scss',
})
export class ApRoot {
  @Element()
  el!: HTMLApRootElement;

  @Prop()
  routeMatches!: RouteMatch[];

  @Prop()
  componentProps?: { [k: string]: any };

  @Prop()
  defaultPath = '/';

  @Prop()
  redirect?: (p: string) => string | undefined;

  @State()
  path?: string;

  @Listen('popstate', { target: 'window' })
  handlePopState() {
    const p = location.pathname;
    const m = pathMatcher(this.routeMatches, p);
    if (!m) {
      redirectRoute(this.defaultPath);
      return;
    }

    if (this.redirect) {
      const r = this.redirect(p);
      if (r) {
        redirectRoute(r);
        return;
      }
    }

    this.path = p;
  }

  componentWillLoad() {
    this.handlePopState();
    this.defaultApHead = document.querySelector<HTMLApHeadElement>('ap-head.default');
  }

  private defaultApHead?: HTMLApHeadElement | null;

  private tags = new Map<string, Record<string, any>>();

  render() {
    const p = this.path;
    if (!p) {
      return;
    }
    const m = pathMatcher(this.routeMatches, p);
    if (!m || !m.match.tag) {
      console.warn('missing page', m);
      return;
    }

    const curTag = m.match.tag;
    this.tags.set(curTag, { ...m.params, ...this.componentProps });

    return (
      <Host>
        {[...this.tags.entries()].map(([Tag, params]) => {
          const visible = Tag == curTag;
          return (
            <Tag
              key={Tag}
              class={{ page: true, hide: !visible }}
              pageVisible={visible}
              {...params}
            />
          );
        })}
      </Host>
    );
  }

  componentDidRender() {
    this.el.children;

    const page = searchElement(this.el.children, el => {
      return el.classList.contains('page') && !el.classList.contains('hide');
    });

    if (page) {
      const apHead = searchElement(page.children, el => {
        return el.tagName == 'AP-HEAD';
      }) as HTMLApHeadElement;
      if (apHead) {
        void apHead.writeHead();
      } else if (this.defaultApHead) {
        void this.defaultApHead.writeHead();
      }

      page.dispatchEvent(new CustomEvent('PageActivated'));
    }
  }
}

const searchElement = (c: HTMLCollection, cb: (el: HTMLElement) => boolean) => {
  for (let i = 0; i < c.length; i++) {
    const el = c.item(i) as HTMLElement;
    if (cb(el)) {
      return el;
    }
  }
  return;
};
