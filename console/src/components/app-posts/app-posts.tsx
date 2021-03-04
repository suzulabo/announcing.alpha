import { Component, Fragment, h, Host, Listen, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

const scrollPosMap = new Map<string, number>();

@Component({
  tag: 'app-posts',
  styleUrl: 'app-posts.scss',
})
export class AppPosts {
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
  renderedPosts: any[];

  private announce: AnnounceState;

  private postsMap: Map<string, { loaded: boolean; el: any }>;

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

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID);
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;

    this.iob = new IntersectionObserver(this.iobCallback, {});

    this.postsMap = new Map();
    const posts = [...(this.announce.posts || [])].reverse();
    for (const v of posts) {
      this.postsMap.set(v, { loaded: false, el: this.renderSkeletonPost(v) });
    }

    this.renderPosts();
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
        <hr />
        <div class="body"></div>
      </a>
    );
  }

  private async renderPost(postID: string) {
    const post = await this.app.getPost(this.announceID, postID);
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
        <hr />
        <div class="body">{post.body}</div>
      </a>
    );
  }

  private renderPosts() {
    this.renderedPosts = [...this.postsMap.values()].map(v => v.el);
  }

  render() {
    if (!this.announce) {
      return;
    }

    const noPosts = !this.announce.posts || this.announce.posts.length == 0;

    return (
      <Host>
        {noPosts && (
          <Fragment>
            <div>{this.app.msgs.posts.noPosts}</div>
            <a {...this.app.href(`${this.announceID}/post_`)}>{this.app.msgs.posts.newPost}</a>
          </Fragment>
        )}
        {!noPosts && (
          <Fragment>
            <a class="button" {...this.app.href(`${this.announceID}/post_`)}>
              +
            </a>
            {this.renderedPosts}
          </Fragment>
        )}
      </Host>
    );
  }
}
