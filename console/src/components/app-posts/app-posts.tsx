import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';
import { href } from 'stencil-router-v2';

@Component({
  tag: 'app-posts',
  styleUrl: 'app-posts.scss',
})
export class AppPosts {
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
    const as = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;

    this.iob = new IntersectionObserver(this.iobCallback, {});

    this.postsMap = new Map();
    const posts = [...this.announce.posts].reverse();
    for (const v of posts) {
      this.postsMap.set(v, { loaded: false, el: this.renderSkeletonPost(v) });
    }

    this.renderPosts();
  }

  disconnectedCallback() {
    this.iob?.disconnect();
  }

  /*
  private async loadPosts() {
    if (!this.announce.posts) {
      return;
    }

    const id = this.announceID.toUpperCase();
    const posts = this.announce.posts
      .reverse()
      .slice(this.renderedPosts.length, this.renderedPosts.length + PAGE_SIZE);

    const rendered = [];

    for (const postID of posts) {
      const post = await this.app.getPost(id, postID);
      if (!post) {
        rendered.push(<div class="post">no post data</div>);
        continue;
      }
      const imgData = post.img ? await this.app.getImage(post.img) : null;

      rendered.push(
        <div class="post">
          {imgData && <img src={imgData} />}
          <div class="content">
            <span class="date">{this.app.msgs.common.datetime(post.pT)}</span>
            <span class="title">{post.title}</span>
            <div class="body">{post.body}</div>
            {post.link && (
              <a class="link" href={post.link} target="_blank" rel="noopener">
                {post.link}
              </a>
            )}
          </div>
        </div>,
      );
    }

    this.renderedPosts = [...this.renderedPosts, ...rendered];
  }
  */

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
      <div
        key={`post-${postID}`}
        class="post skeleton"
        ref={this.handleRef.observe}
        data-postid={postID}
      >
        <span class="date"></span>
        <span class="title"></span>
        <hr />
        <div class="body"></div>
      </div>
    );
  }

  private async renderPost(postID: string) {
    const post = await this.app.getPost(this.announceID.toUpperCase(), postID);
    if (!post) {
      return <div class="post">no post data: [{postID}]</div>;
    }

    return (
      <div key={`post-${postID}`} class="post" ref={this.handleRef.observe}>
        <span class="date">{this.app.msgs.common.datetime(post.pT)}</span>
        <span class="title">{post.title}</span>
        <hr />
        <div class="body">{post.body}</div>
      </div>
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
            <div>{this.app.msgs.post.home.noPosts}</div>
            <a {...href('f')}>{this.app.msgs.post.home.newPost}</a>
          </Fragment>
        )}
        {!noPosts && (
          <Fragment>
            <a class="button" {...href('f')}>
              +
            </a>
            {this.renderedPosts}
          </Fragment>
        )}
      </Host>
    );
  }
}
