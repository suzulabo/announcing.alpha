import { Component, h, Host, Listen, Prop, readTask, State } from '@stencil/core';

const scrollPosMap = new Map<string, number>();

@Component({
  tag: 'ap-announce',
  styleUrl: 'ap-announce.scss',
})
export class ApAnnounce {
  @Listen('scroll', { target: 'window' })
  handleWindowScroll() {
    scrollPosMap.set(location.href, window.scrollY);
  }

  componentDidLoad() {
    if (scrollPosMap.has(location.href)) {
      readTask(() => {
        window.scroll(0, scrollPosMap.get(location.href));
      });
    }
  }

  @Prop()
  announce: {
    name: string;
    desc?: string;
    iconData?: string;
    link?: string;
    posts?: string[];
  };

  @Prop()
  postLoader: (
    id: string,
  ) => Promise<{
    title?: string;
    body: string;
    imgData?: string;
    link?: string;
    pT: number;
    anchorAttrs: { [k: string]: any };
  }>;

  @Prop()
  msgs: {
    datetime: (d: number) => string;
    noPosts: string;
  };

  @State()
  renderedPosts: any[];

  private iob: IntersectionObserver;
  private postsMap: Map<string, { loaded: boolean; el: any }>;

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
      if (this.postsMap.get(postID)?.loaded) {
        continue;
      }

      const el = await this.renderPost(postID);
      this.postsMap.set(postID, { loaded: true, el });
      updated = true;
    }

    if (updated) {
      this.updateRenderdPosts();
    }
  };

  componentWillLoad() {
    this.iob = new IntersectionObserver(this.iobCallback, {});

    this.postsMap = new Map();
    const posts = [...(this.announce.posts || [])].reverse();
    for (const v of posts) {
      this.postsMap.set(v, { loaded: false, el: this.renderSkeletonPost(v) });
    }

    this.updateRenderdPosts();
  }

  disconnectedCallback() {
    this.iob?.disconnect();
  }
  private handleRef = {
    observe: (el: HTMLElement) => {
      this.iob.observe(el);
    },
    unobserve: (el: HTMLElement) => {
      this.iob.unobserve(el);
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
    const post = await this.postLoader(postID);
    if (!post) {
      return <div class="post">no post data: [{postID}]</div>;
    }

    return (
      <a {...post.anchorAttrs} key={`post-${postID}`} class="post" ref={this.handleRef.observe}>
        <span class="date">{this.msgs.datetime(post.pT)}</span>
        {post.title && <span class="title">{post.title}</span>}
        <div class="body">{post.body}</div>
      </a>
    );
  }

  private updateRenderdPosts() {
    this.renderedPosts = [...this.postsMap.values()].map(v => v.el);
  }

  render() {
    const announce = this.announce;
    const noPosts = !announce.posts || announce.posts.length == 0;

    return (
      <Host>
        <div class="head">
          <span class="name">{announce.name}</span>
          {announce.iconData && <img src={announce.iconData} />}
        </div>
        {announce.desc && <span class="desc">{announce.desc}</span>}
        {announce.link && (
          <a class="link" href={announce.link}>
            {announce.link}
          </a>
        )}
        <slot name="bottomAnnounce" />
        <hr />
        {noPosts && <span class="no-posts">{this.msgs.noPosts}</span>}
        <slot name="beforePosts" />
        {!noPosts && this.renderedPosts}
      </Host>
    );
  }
}
