import { Component, h, Host, Prop, State } from '@stencil/core';
import { DataResult, DATA_ERROR, PostJSON } from 'src/shared';

export type PostLaoderResult = DataResult<PostJSON> & { hrefAttrs?: Record<string, any> };

@Component({
  tag: 'ap-announce',
  styleUrl: 'ap-announce.scss',
})
export class ApAnnounce {
  @Prop()
  announce!: {
    name: string;
    desc?: string;
    iconLoader?: () => Promise<string>;
    link?: string;
    posts: Record<
      string,
      {
        pT: {
          toMillis: () => number;
        };
      }
    >;
  };

  @Prop()
  postLoader!: (id: string) => Promise<PostLaoderResult>;

  @Prop()
  msgs!: {
    datetime: (d: number) => string;
    noPosts: string;
    postDataError: string;
  };

  @State()
  loadedPosts = new Map<string, PostLaoderResult | undefined>();

  private iob: IntersectionObserver;

  private iobCallback = (entries: IntersectionObserverEntry[]) => {
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
      this.loadedPosts.set(postID, undefined);

      this.postLoader(postID)
        .then(result => {
          this.loadedPosts.set(postID, result);
        })
        .catch(err => {
          console.error('postLoader Error', err);
          this.loadedPosts.set(postID, DATA_ERROR);
        });

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

  private renderPost(postID: string, postResult: PostLaoderResult) {
    if (postResult.state != 'SUCCESS') {
      return <div class="card post post-data-error">{this.msgs.postDataError}</div>;
    }

    const post = postResult.value;
    return (
      <a
        key={`post-${postID}`}
        class="card post"
        ref={this.handleRef.observe}
        {...postResult.hrefAttrs}
      >
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
      const postResult = this.loadedPosts.get(id);
      return postResult ? this.renderPost(id, postResult) : this.renderSkeletonPost(id);
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
        <div class="announce">
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
          <slot name="botom-announce" />
        </div>
        {noPosts && <div class="no-posts">{this.msgs.noPosts}</div>}
        <slot name="beforePosts" />
        {!noPosts && this.renderPosts()}
      </Host>
    );
  }
}
