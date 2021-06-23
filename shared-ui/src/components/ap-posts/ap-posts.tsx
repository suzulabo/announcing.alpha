import { Component, Element, forceUpdate, Fragment, h, Host, Prop, Watch } from '@stencil/core';
import { Announce, PostJSON } from 'src/shared';
import { PromiseState } from '../utils/promise';
import { href } from '../utils/route';

@Component({
  tag: 'ap-posts',
  styleUrl: 'ap-posts.scss',
})
export class ApPosts {
  @Element()
  el!: HTMLApPostsElement;

  @Prop()
  posts!: Announce['posts'];

  @Prop()
  postsPromises!: Record<string, PromiseState<PostJSON>>;

  @Prop()
  hrefFormat?: string;

  private postIds!: string[];

  @Watch('posts')
  watchPosts() {
    const pe = Object.entries(this.posts);
    pe.sort(([, p1], [, p2]) => {
      return p2.pT.toMillis() - p1.pT.toMillis();
    });
    this.postIds = pe.map(([id]) => id);

    this.visibleMap = new Map();

    if (this.iob) {
      this.iob.disconnect();
    }
    this.iob = new IntersectionObserver(this.iobCallback, {
      rootMargin: '100px 0px 100px 0px',
    });
  }

  @Prop()
  msgs!: {
    datetime: (d: number) => string;
    dataError: string;
  };

  private visibleMap = new Map<string, boolean>();

  private iob!: IntersectionObserver;

  private iobCallback = (entries: IntersectionObserverEntry[]) => {
    if (entries.length == 0) {
      return;
    }

    for (const entry of entries) {
      const postID = entry.target.getAttribute('data-postid');
      if (!postID) {
        continue;
      }

      this.visibleMap.set(postID, entry.isIntersecting);
    }
    forceUpdate(this.el);
  };

  componentWillLoad() {
    this.watchPosts();
  }

  disconnectedCallback() {
    this.iob?.disconnect();
  }

  private handleRef = (elm?: HTMLElement) => {
    if (elm) {
      this.iob.observe(elm);
    }
  };

  private renderPost(postID: string): { href?: string; el: any } {
    if (!this.visibleMap.get(postID)) {
      return { el: <Fragment></Fragment> };
    }

    const state = this.postsPromises[postID];

    if (state.error()) {
      return { el: <Fragment>{this.msgs.dataError}</Fragment> };
    }

    const post = state.result();
    if (!post) {
      return {
        el: <ap-spinner />,
      };
    }

    return {
      href: this.hrefFormat ? this.hrefFormat.replace(':postID', postID) : undefined,
      el: (
        <Fragment>
          <span class="date">{this.msgs.datetime(post.pT)}</span>
          {post.title && <span class="title">{post.title}</span>}
          {post.body && <div class="body">{post.body}</div>}
        </Fragment>
      ),
    };
  }

  render() {
    return (
      <Host>
        {this.postIds.map(id => {
          const r = this.renderPost(id);
          return (
            <a key={id} data-postid={id} ref={this.handleRef} class="card post" {...href(r.href)}>
              {r.el}
            </a>
          );
        })}
      </Host>
    );
  }
}
