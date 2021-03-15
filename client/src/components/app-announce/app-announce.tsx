import { Component, h, Host, Listen, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';

const scrollPosMap = new Map<string, number>();

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Listen('scroll', { target: 'window' })
  handleWindowScroll() {
    scrollPosMap.set(this.announceID, window.scrollY);
  }

  componentDidLoad() {
    if (scrollPosMap.has(this.announceID)) {
      window.scroll(0, scrollPosMap.get(this.announceID));
    }
  }

  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @State()
  announce: { name: string; desc: string; link: string; icon: string; posts: string[] };

  @State()
  renderedPosts: any[];

  private postsMap: Map<string, { loaded: boolean; el: any }>;
  private iob: IntersectionObserver;

  async componentWillLoad() {
    this.app.loading = true;
    try {
      const announce = await this.app.getAnnounce(this.announceID);
      const meta = await this.app.fetchAnnounceMeta(this.announceID, announce.mid);
      this.announce = {
        name: meta.name,
        desc: meta.desc,
        link: meta.link,
        icon: meta.icon,
        posts: announce.posts || [],
      };

      this.iob = new IntersectionObserver(this.iobCallback, {});

      this.postsMap = new Map();
      const posts = [...(this.announce.posts || [])].reverse();
      for (const v of posts) {
        this.postsMap.set(v, { loaded: false, el: this.renderSkeletonPost(v) });
      }

      this.renderPosts();
    } finally {
      this.app.loading = false;
    }
  }

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
      this.renderPosts();
    }
  };

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
        <hr />
        <div class="body"></div>
      </a>
    );
  }

  private async renderPost(postID: string) {
    const post = await this.app.fetchPost(this.announceID, postID);
    if (!post) {
      return <div class="post">no post data: [{postID}]</div>;
    }

    return (
      <a
        {...this.app.href(`${this.announceID}/${postID}`)}
        key={`post-${postID}`}
        class="post"
        ref={this.handleRef.observe}
      >
        <span class="date">{this.app.msgs.common.datetime(post.pT)}</span>
        <span class="title">{post.title}</span>
      </a>
    );
  }

  private renderPosts() {
    const l = [];
    this.postsMap.forEach(v => {
      l.push(v.el, <hr />);
    });
    l.pop();
    this.renderedPosts = l;
  }

  render() {
    if (!this.announce) {
      return;
    }

    const noPosts = this.announce.posts.length == 0;

    return (
      <Host>
        {this.announce.icon && <img src={this.app.getImageURI(this.announce.icon)} />}
        <div class="name">{this.announce.name}</div>
        {this.announce.desc && <div class="desc">{this.announce.desc}</div>}
        {this.announce.link && (
          <a href={this.announce.link} rel="noopener">
            {this.announce.link}
          </a>
        )}
        <hr />
        {noPosts && <div>{this.app.msgs.announce.noPosts}</div>}
        {!noPosts && this.renderedPosts}
      </Host>
    );
  }
}
