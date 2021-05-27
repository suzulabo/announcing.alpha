import { Component, h, Host, Listen, Prop, readTask, State } from '@stencil/core';

@Component({
  tag: 'ap-announce',
  styleUrl: 'ap-announce.scss',
})
export class ApAnnounce {
  private scrollTimer?: number;

  @Listen('scroll', { target: 'window' })
  handleWindowScroll() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }

    const href = location.href;
    this.scrollTimer = window.setTimeout(() => {
      if (href == location.href) {
        const state = { ...(history.state || {}), scrollY: window.scrollY };
        history.replaceState(state, '');
      }
    }, 100);
  }

  componentDidLoad() {
    const v = history.state.scrollY as number | undefined;
    if (v != null) {
      readTask(() => {
        window.scroll(0, v);
      });
    }
  }

  @Prop()
  announce!: {
    name: string;
    desc?: string;
    iconLoader?: () => Promise<string>;
    link?: string;
    posts: {
      [postID: string]: {
        pT: {
          toMillis: () => number;
        };
      };
    };
  };

  @Prop()
  postLoader?: (
    id: string,
  ) => Promise<
    | {
        title?: string;
        body?: string;
        imgData?: string;
        link?: string;
        pT: number;
        anchorAttrs: { [k: string]: any };
      }
    | undefined
  >;

  @Prop()
  msgs!: {
    datetime: (d: number) => string;
    noPosts: string;
    postDataError: string;
  };

  @State()
  loadedPosts = new Map<string, any>();

  private iob: IntersectionObserver;

  private iobCallback = async (entries: IntersectionObserverEntry[]) => {
    let updated = false;

    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      const postID = entry.target.getAttribute('data-postid');
      if (!postID) {
        continue;
      }
      if (this.loadedPosts.has(postID)) {
        continue;
      }

      const el = await this.renderPost(postID);
      this.loadedPosts.set(postID, el);
      updated = true;
    }

    if (updated) {
      this.loadedPosts = new Map(this.loadedPosts);
    }
  };

  constructor() {
    this.iob = new IntersectionObserver(this.iobCallback, {});
  }

  disconnectedCallback() {
    this.iob?.disconnect();
  }
  private handleRef = {
    observe: (el: HTMLElement | undefined) => {
      if (el) {
        this.iob.observe(el);
      }
    },
  };

  private renderSkeletonPost(postID: string) {
    return (
      <a
        key={`post-${postID}`}
        class="post skeleton"
        ref={this.handleRef.observe}
        data-postid={postID}
      >
        <span class="date"></span>
        <span class="title"></span>
        <div class="body"></div>
      </a>
    );
  }

  private async renderPost(postID: string) {
    if (!this.postLoader) {
      return;
    }
    const post = await this.postLoader(postID);
    if (!post) {
      return <div class="post post-data-error">{this.msgs.postDataError}</div>;
    }

    return (
      <a {...post.anchorAttrs} key={`post-${postID}`} class="post" ref={this.handleRef.observe}>
        <span class="date">{this.msgs.datetime(post.pT)}</span>
        {post.title && <span class="title">{post.title}</span>}
        {post.body && <div class="body">{post.body}</div>}
      </a>
    );
  }

  private renderPosts() {
    const posts = Object.entries(this.announce.posts).sort(([, v1], [, v2]) => {
      return v2.pT.toMillis() - v1.pT.toMillis();
    });
    return posts.map(([id]) => {
      return this.loadedPosts.has(id) ? this.loadedPosts.get(id) : this.renderSkeletonPost(id);
    });
  }

  render() {
    const announce = this.announce;
    if (!announce) {
      return;
    }
    const noPosts = Object.keys(announce.posts).length == 0;

    return (
      <Host>
        <div class="head">
          <span class="name">{announce.name}</span>
          {announce.iconLoader && <ap-image loader={announce.iconLoader} />}
        </div>
        {announce.desc && <ap-textview class="desc" text={announce.desc} />}
        {announce.link && (
          <a class="link" href={announce.link}>
            {announce.link}
          </a>
        )}
        <slot name="bottomAnnounce" />
        <hr />
        {noPosts && <span class="no-posts">{this.msgs.noPosts}</span>}
        <slot name="beforePosts" />
        {!noPosts && this.renderPosts()}
      </Host>
    );
  }
}
